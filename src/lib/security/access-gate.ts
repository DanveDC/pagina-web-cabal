// ─── Private-link gate for the emission module ──────────────────────────────
// When EMITIR_ACCESS_KEY is set, /emitir and the APIs it uses require either
// `?acceso=<key>` (once, which sets a cookie) or that cookie. The cookie holds an
// HMAC of the key, never the key itself. Pure module (Web Crypto only) so it
// runs in the proxy and in node:test.

export const ACCESS_COOKIE = "cabal_emitir_acceso";
export const ACCESS_PARAM = "acceso";
export const ACCESS_MAX_AGE_SEC = 30 * 24 * 60 * 60; // 30 days

const PROTECTED_PAGES = ["/emitir"];
const PROTECTED_APIS = ["/api/emitir", "/api/consultar-cliente"];

const under = (pathname: string, base: string) =>
  pathname === base || pathname.startsWith(base + "/");

export function protectedKind(pathname: string): "page" | "api" | null {
  if (PROTECTED_PAGES.some((b) => under(pathname, b))) return "page";
  if (PROTECTED_APIS.some((b) => under(pathname, b))) return "api";
  return null;
}

/** Hex HMAC-SHA256(key, "cabal-emitir-access-v1"). */
export async function accessToken(key: string): Promise<string> {
  const enc = new TextEncoder();
  const k = await crypto.subtle.importKey(
    "raw",
    enc.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", k, enc.encode("cabal-emitir-access-v1"));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Length-independent comparison of two strings. */
export function safeEqual(a: string, b: string): boolean {
  let diff = a.length ^ b.length;
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}
