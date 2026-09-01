// ─── Internal route: consultar cliente (PII lookup) ────────────────────────
// The browser calls this route. It injects SC_PROXY_TOKEN server-side and
// forwards to /api/seguros-caracas/cliente. The token never reaches the
// browser; the SC proxy still performs full Zod validation and credential
// injection.

import { NextRequest, NextResponse } from "next/server";
import { rateLimit, clientIp } from "@/lib/security/rate-limit";
import { rateLimit as rlConfig } from "@/lib/security/env";
import { isAllowedOrigin } from "@/lib/security/origin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token = process.env.SC_PROXY_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "service_disabled" }, { status: 503 });
  }

  // Browser-only entry point: a real Origin/Referer is required.
  if (!isAllowedOrigin(req)) {
    return NextResponse.json({ error: "forbidden_origin" }, { status: 403 });
  }

  // Rate-limit here, at the real entry point: the downstream fetch to the SC
  // proxy is server-to-server and carries no client IP, so its limiter would
  // otherwise bucket every lookup into one global key.
  const rl = rateLimit(
    `GET:consultar-cliente:${clientIp(req)}`,
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

  // Forward to our own SC proxy with the Bearer token injected server-side.
  const params = new URL(req.url).searchParams.toString();
  const res = await fetch(
    `${req.nextUrl.origin}/api/seguros-caracas/cliente${params ? `?${params}` : ""}`,
    {
      method: "GET",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    }
  );

  const data = await res.json();
  return NextResponse.json(data, {
    status: res.status,
    headers: { "Cache-Control": "no-store" },
  });
}
