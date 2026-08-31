// ─── Internal route: Emitir póliza HOGAR ────────────────────────────────────
// The browser calls this route. This route adds the SC_PROXY_TOKEN server-side
// and forwards to /api/seguros-caracas/suscribir. The token never reaches the
// browser.

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const token = process.env.SC_PROXY_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "service_disabled" }, { status: 503 });
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
  const res = await fetch(`${origin}/api/seguros-caracas/suscribir`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
