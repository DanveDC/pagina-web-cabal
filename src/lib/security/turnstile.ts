// Server-side verification of a Cloudflare Turnstile token. Fail-closed.

export type TurnstileOutcome =
  | { ok: true }
  | { ok: false; reason: "missing_token" | "invalid_token" | "unavailable" };

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function verifyTurnstile(
  token: string | null,
  remoteIp: string,
  secret: string,
  timeoutMs = 5_000,
  fetchImpl: typeof fetch = fetch
): Promise<TurnstileOutcome> {
  if (!token || token.length > 2048) return { ok: false, reason: "missing_token" };
  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp && remoteIp !== "no-ip") body.set("remoteip", remoteIp);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetchImpl(VERIFY_URL, { method: "POST", body, signal: ctrl.signal });
    if (!res.ok) return { ok: false, reason: "unavailable" };
    const data = (await res.json()) as { success?: boolean };
    return data.success === true ? { ok: true } : { ok: false, reason: "invalid_token" };
  } catch {
    return { ok: false, reason: "unavailable" };
  } finally {
    clearTimeout(timer);
  }
}
