import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Liveness probe for the platform load balancer. Intentionally leaks nothing:
// no version, no env, no dependency status.
export function GET() {
  return NextResponse.json(
    { status: "ok" },
    { headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } }
  );
}
