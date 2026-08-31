// ─── Proxy → Seguros Caracas HOGAR web service ─────────────────────────────
// Seguros Caracas authorises callers by server-IP allowlist, so every call
// MUST originate from this server. The browser never talks to SC directly and
// never sees the broker credentials.
//
// Defense in depth applied here:
//   1. Master kill-switch (SC_PROXY_ENABLED)
//   2. Allowed-origin check (anti cross-site abuse)
//   3. Per-IP rate limiting
//   4. Strict method + segment allowlist
//   5. Bearer-token gate on sensitive ops (suscribir writes; cliente exposes PII)
//   6. Zod validation of everything the client can influence
//   7. Server-side credential injection
//   8. Upstream timeout + response-size cap + content-type check
//   9. Sanitised errors (details are logged, never returned)

import { NextResponse } from "next/server";
import { createHash, timingSafeEqual, randomUUID } from "node:crypto";
import { segurosCaracas, rateLimit as rlConfig } from "@/lib/security/env";
import { rateLimit, clientIp } from "@/lib/security/rate-limit";
import { isAllowedOrigin } from "@/lib/security/origin";
import { catalogQuery, suscribirBody, type CatalogSegment } from "@/lib/api/seguros-caracas.schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROUTE_MAP = {
  listas: "/hogarswservicios/hogarsw/consultarListasIniciales",
  ciudades: "/hogarswservicios/hogarsw/consultarCiudades",
  sectores: "/hogarswservicios/hogarsw/consultarSectores",
  propuestas: "/hogarswservicios/hogarsw/consultarPropuestas",
  suscribir: "/hogarswservicios/hogarsw/suscribir",
  cliente: "/suscripcionexternaswservicios/suscripcionexternasw/consultarCliente",
} as const satisfies Record<CatalogSegment | "suscribir", string>;

type Segment = keyof typeof ROUTE_MAP;

const GET_SEGMENTS: Segment[] = ["listas", "ciudades", "sectores", "propuestas", "cliente"];
const SENSITIVE: Segment[] = ["suscribir", "cliente"];
const CACHEABLE: Segment[] = ["listas", "ciudades", "sectores"];

// ─── helpers ───────────────────────────────────────────────────────────────

function fail(status: number, code: string, extraHeaders?: Record<string, string>) {
  return NextResponse.json(
    { error: code, cdError: -1 },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        ...extraHeaders,
      },
    }
  );
}

function tokenOk(header: string | null): boolean {
  const expected = segurosCaracas.proxyToken;
  if (!expected) return false; // not configured → sensitive ops disabled
  const got = header?.replace(/^Bearer\s+/i, "").trim() ?? "";
  // Hash both sides to a fixed length so the compare leaks neither length nor
  // content via timing.
  const a = createHash("sha256").update(got).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

function isSegment(v: string | undefined): v is Segment {
  return v !== undefined && Object.prototype.hasOwnProperty.call(ROUTE_MAP, v);
}

async function callUpstream(
  path: string,
  init: RequestInit & { rawBody?: string }
): Promise<NextResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), segurosCaracas.timeoutMs);
  const url = `${segurosCaracas.baseUrl}${path}`;

  try {
    const upstream = await fetch(url, {
      ...init,
      body: init.rawBody,
      signal: controller.signal,
      redirect: "error",
    });

    const contentType = upstream.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      console.error(`[sc-proxy] non-JSON upstream (${upstream.status} ${contentType}) for ${path}`);
      return fail(502, "upstream_bad_response");
    }

    const buf = await upstream.arrayBuffer();
    if (buf.byteLength > segurosCaracas.maxResponseBytes) {
      return fail(502, "upstream_response_too_large");
    }

    let data: unknown;
    try {
      data = JSON.parse(Buffer.from(buf).toString("utf8"));
    } catch {
      return fail(502, "upstream_bad_response");
    }

    return NextResponse.json(data, {
      status: upstream.status >= 500 ? 502 : upstream.status,
      headers: { "X-Content-Type-Options": "nosniff" },
    });
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    console.error(`[sc-proxy] upstream error for ${path}:`, err);
    return fail(aborted ? 504 : 502, aborted ? "upstream_timeout" : "upstream_unreachable");
  } finally {
    clearTimeout(timer);
  }
}

// ─── gate shared by GET and POST ───────────────────────────────────────────

function gate(req: Request, segment: Segment, method: "GET" | "POST"): NextResponse | null {
  if (!segurosCaracas.enabled || !segurosCaracas.baseUrl) return fail(503, "service_disabled");

  const sensitive = SENSITIVE.includes(segment);

  // Catalog routes: must come from an allowed origin (no anonymous scraping).
  // Sensitive routes: origin may be absent (server-to-server) — the token is
  // the real gate.
  if (!isAllowedOrigin(req, { allowMissing: sensitive })) return fail(403, "forbidden_origin");

  const authed = sensitive && tokenOk(req.headers.get("authorization"));

  // Namespace the rate-limit bucket by auth state so an unauthenticated flood
  // (e.g. bad-token probing) cannot consume the legitimate caller's quota.
  const ns = sensitive ? (authed ? "auth" : "anon") : "pub";
  const limitMax = sensitive ? rlConfig.sensitiveMax : rlConfig.catalogMax;
  const rl = rateLimit(`${method}:${segment}:${ns}:${clientIp(req)}`, limitMax, rlConfig.windowMs);
  if (!rl.ok) {
    return fail(429, "rate_limited", {
      "Retry-After": String(rl.retryAfterSec),
      "RateLimit-Limit": String(rl.limit),
      "RateLimit-Remaining": "0",
    });
  }

  if (sensitive && !authed) return fail(401, "unauthorized");

  return null;
}

// ─── GET (catalog reads + client lookup) ───────────────────────────────────

export async function GET(
  req: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const rid = randomUUID();
  const { path } = await params;
  const segment = path?.[0];

  if (!isSegment(segment) || !GET_SEGMENTS.includes(segment)) return fail(404, "unknown_route");

  const blocked = gate(req, segment, "GET");
  if (blocked) return blocked;

  const rawParams = Object.fromEntries(new URL(req.url).searchParams);
  const parsed = catalogQuery[segment as CatalogSegment].safeParse(rawParams);
  if (!parsed.success) {
    console.warn(`[sc-proxy ${rid}] invalid query for ${segment}`);
    return fail(400, "invalid_parameters");
  }

  // Build the upstream query — server injects broker credentials.
  const sp = new URLSearchParams(parsed.data as Record<string, string>);
  if (segment === "propuestas" || segment === "cliente") {
    if (!segurosCaracas.productor) return fail(503, "credentials_not_configured");
    sp.set("cdProductor", segurosCaracas.productor);
  }
  if (segment === "propuestas") {
    if (!segurosCaracas.convenio) return fail(503, "credentials_not_configured");
    sp.set("cdConvenio", segurosCaracas.convenio);
  }

  const qs = sp.toString();
  const res = await callUpstream(`${ROUTE_MAP[segment]}${qs ? `?${qs}` : ""}`, { method: "GET" });

  if (CACHEABLE.includes(segment)) {
    res.headers.set("Cache-Control", "private, max-age=300, stale-while-revalidate=600");
  } else {
    res.headers.set("Cache-Control", "no-store");
  }
  return res;
}

// ─── POST (suscribir — creates a policy) ───────────────────────────────────

export async function POST(
  req: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const rid = randomUUID();
  const { path } = await params;
  const segment = path?.[0];

  if (segment !== "suscribir") return fail(404, "unknown_route");

  const blocked = gate(req, "suscribir", "POST");
  if (blocked) return blocked;

  if (req.headers.get("content-type")?.includes("application/json") !== true) {
    return fail(415, "unsupported_media_type");
  }

  let json: unknown;
  try {
    const text = await req.text();
    if (text.length > 200_000) return fail(413, "payload_too_large");
    json = JSON.parse(text);
  } catch {
    return fail(400, "invalid_json");
  }

  const parsed = suscribirBody.safeParse(json);
  if (!parsed.success) {
    console.warn(`[sc-proxy ${rid}] invalid suscribir body:`, parsed.error.flatten().fieldErrors);
    return fail(400, "invalid_parameters");
  }

  if (!segurosCaracas.productor || !segurosCaracas.convenio) {
    return fail(503, "credentials_not_configured");
  }

  // Server injects broker credentials into the pedido; the client cannot set them.
  const payload = {
    pedido: {
      ...parsed.data.pedido,
      cdProductor: segurosCaracas.productor,
      cdConvenio: segurosCaracas.convenio,
      cdUsuario: segurosCaracas.productor,
    },
  };

  const res = await callUpstream(ROUTE_MAP.suscribir, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    rawBody: JSON.stringify(payload),
  });
  res.headers.set("Cache-Control", "no-store");
  return res;
}

// ─── everything else ───────────────────────────────────────────────────────

export function PUT() {
  return fail(405, "method_not_allowed", { Allow: "GET, POST" });
}
export const DELETE = PUT;
export const PATCH = PUT;
