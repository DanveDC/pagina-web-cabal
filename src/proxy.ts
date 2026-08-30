import { NextRequest, NextResponse } from "next/server";

// ─── Per-request Content-Security-Policy with a fresh nonce ─────────────────
// Static security headers live in next.config.ts. CSP lives here because the
// script nonce must be unique per response. Next.js automatically stamps this
// nonce onto its own <script> tags when it sees it in the request CSP header.
// (Next 16.3 renamed the "middleware" convention to "proxy".)

const isDev = process.env.NODE_ENV !== "production";

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  const csp = [
    `default-src 'self'`,
    // 'strict-dynamic' lets Next's nonce'd bootstrap script load the rest of
    // the bundle; the explicit 'self' is the fallback for browsers without it.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    // Inline styles are used pervasively (style={{…}} + framer-motion); a nonce
    // cannot cover runtime-injected styles, so 'unsafe-inline' is required here.
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob:`,
    `font-src 'self'`,
    `connect-src 'self'${isDev ? " ws: http://localhost:*" : ""}`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `frame-src 'none'`,
    `manifest-src 'self'`,
    `worker-src 'self' blob:`,
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("content-security-policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("content-security-policy", csp);
  return response;
}

export const config = {
  matcher: [
    // Run on every route except Next internals and static asset files.
    {
      source:
        "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpe?g|gif|webp|svg|ico|woff2?|ttf|otf)$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
