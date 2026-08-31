import "server-only";
import { ALLOWED_ORIGINS, ALLOWED_ORIGINS_UNSET, isProd } from "./env";

let warned = false;
function warnOnce() {
  if (warned) return;
  warned = true;
  console.warn(
    "[security] ALLOWED_ORIGINS is not set in production — API routes are same-origin-only."
  );
}

// ─── Allowed-origin enforcement ────────────────────────────────────────────
// Browsers send `Origin` on cross-origin and all non-GET requests, and send
// `Referer` on same-origin navigations/fetches (our Referrer-Policy is
// `strict-origin-when-cross-origin`, so same-origin requests keep a usable
// Referer). Non-browser clients send neither.
//
// `allowMissing: true` is used only for token-gated sensitive routes, where a
// legitimate server-to-server caller has no Origin/Referer and the bearer token
// is the real access control.

export function isAllowedOrigin(req: Request, opts: { allowMissing?: boolean } = {}): boolean {
  if (ALLOWED_ORIGINS_UNSET) warnOnce();
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  const candidate = origin ?? safeOrigin(referer);

  if (!candidate) return opts.allowMissing === true;

  if (ALLOWED_ORIGINS.length > 0) return ALLOWED_ORIGINS.includes(candidate);

  // No allowlist configured. Accept same-origin only, HTTPS only in production.
  const host = req.headers.get("host");
  if (!host) return false;
  if (candidate === `https://${host}`) return true;
  return !isProd && candidate === `http://${host}`;
}

function safeOrigin(url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}
