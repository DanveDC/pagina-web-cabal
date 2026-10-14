import { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_COOKIE,
  ACCESS_MAX_AGE_SEC,
  ACCESS_PARAM,
  accessToken,
  protectedKind,
  safeEqual,
} from "@/lib/security/access-gate";

// ─── Per-request Content-Security-Policy with a fresh nonce ─────────────────
// Static security headers live in next.config.ts. CSP lives here because the
// script nonce must be unique per response. Next.js automatically stamps this
// nonce onto its own <script> tags when it sees it in the request CSP header.
// (Next 16.3 renamed the "middleware" convention to "proxy".)

const isDev = process.env.NODE_ENV !== "production";

export async function proxy(request: NextRequest) {
  // ── Private-link gate for /emitir (only when EMITIR_ACCESS_KEY is set) ──
  const accessKey = (process.env.EMITIR_ACCESS_KEY ?? "").trim();
  const kind = accessKey ? protectedKind(request.nextUrl.pathname) : null;
  if (kind) {
    const expected = await accessToken(accessKey);
    const supplied = request.nextUrl.searchParams.get(ACCESS_PARAM);
    if (kind === "page" && supplied !== null) {
      // Valid key → set cookie and redirect to the clean URL (key out of the address bar).
      if (safeEqual(supplied, accessKey)) {
        const clean = request.nextUrl.clone();
        clean.searchParams.delete(ACCESS_PARAM);
        const res = NextResponse.redirect(clean, 303);
        res.cookies.set(ACCESS_COOKIE, expected, {
          httpOnly: true,
          secure: !isDev,
          sameSite: "lax",
          path: "/",
          maxAge: ACCESS_MAX_AGE_SEC,
        });
        res.headers.set("Cache-Control", "no-store");
        res.headers.set("Referrer-Policy", "no-referrer");
        return res;
      }
    }
    const cookie = request.cookies.get(ACCESS_COOKIE)?.value ?? "";
    if (!safeEqual(cookie, expected)) {
      if (kind === "api") {
        return NextResponse.json({ error: "access_restricted" }, { status: 401 });
      }
      // Render the restricted notice in place of the module (same CSP/nonce flow).
      const url = request.nextUrl.clone();
      url.pathname = "/acceso-restringido";
      url.search = "";
      const h = cspHeaders(request);
      const res = NextResponse.rewrite(url, { request: { headers: h.req } });
      res.headers.set("content-security-policy", h.csp);
      res.headers.set("Cache-Control", "no-store");
      return res;
    }
  }

  const h = cspHeaders(request);
  const response = NextResponse.next({ request: { headers: h.req } });
  response.headers.set("content-security-policy", h.csp);
  return response;
}

function cspHeaders(request: NextRequest) {
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
    // Cloudflare Turnstile (anti-bot) renders its challenge in an iframe.
    `frame-src https://challenges.cloudflare.com`,
    `manifest-src 'self'`,
    `worker-src 'self' blob:`,
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("content-security-policy", csp);
  return { req: requestHeaders, csp };
}

export const config = {
  matcher: [
    // Run on every route except Next internals and static asset files.
    // Prefetches are NOT skipped: the /emitir access gate must see every request.
    {
      source:
        "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpe?g|gif|webp|svg|ico|woff2?|ttf|otf)$).*)",
    },
  ],
};
