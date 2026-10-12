// ─── Internal route: Emitir póliza HOGAR ────────────────────────────────────
// The browser calls this route. This route adds the SC_PROXY_TOKEN server-side
// and forwards to /api/seguros-caracas/suscribir. The token never reaches the
// browser.

import { NextRequest, NextResponse } from "next/server";
import { rateLimit, clientIp } from "@/lib/security/rate-limit";
import { rateLimit as rlConfig } from "@/lib/security/env";
import { isAllowedOrigin } from "@/lib/security/origin";
import { classifyEmitirResult } from "@/lib/api/emitir-result";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const token = process.env.SC_PROXY_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "service_disabled" }, { status: 503 });
  }

  // Browser-only entry point: a real Origin/Referer is required (anti-CSRF).
  if (!isAllowedOrigin(req)) {
    return NextResponse.json({ error: "forbidden_origin" }, { status: 403 });
  }

  // Rate-limit here, at the real entry point: the downstream fetch to the SC
  // proxy is server-to-server and carries no client IP, so its limiter would
  // otherwise bucket every emisión into one global key.
  const rl = rateLimit(
    `POST:emitir-hogar:${clientIp(req)}`,
    rlConfig.sensitiveMax,
    rlConfig.windowMs
  );
  if (!rl.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      {
        status: 429,
        headers: {
          "Retry-After": String(rl.retryAfterSec),
          "RateLimit-Limit": String(rl.limit),
          "RateLimit-Remaining": "0",
        },
      }
    );
  }

  let body: unknown;
  try {
    const text = await req.text();
    if (text.length > 200_000) return NextResponse.json({ error: "payload_too_large" }, { status: 413 });
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  // Forward to our own SC proxy with the Bearer token injected server-side.
  const origin = req.nextUrl.origin;
  let res: Response;
  try {
    res = await fetch(`${origin}/api/seguros-caracas/suscribir`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
  } catch {
    return NextResponse.json({ error: "upstream_unreachable" }, { status: 502 });
  }

  // Never trust the upstream body: parse defensively and classify it.
  let data: unknown;
  try {
    data = JSON.parse(await res.text());
  } catch {
    data = undefined;
  }

  const result = classifyEmitirResult(res.status, data);
  if (result.ok) {
    return NextResponse.json(data, { status: res.status });
  }
  return NextResponse.json(
    {
      error: result.code,
      message: result.message,
      ...(result.code === "sc_rejected"
        ? {
            cdError: (data as { cdError?: number }).cdError,
            ...(result.deError ? { deError: result.deError } : {}),
          }
        : {}),
    },
    { status: result.status }
  );
}
