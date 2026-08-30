import "server-only";

// ─── Server-side configuration ──────────────────────────────────────────────
// Central, validated access to environment. Never import this from a Client
// Component — `server-only` will make the build fail if you try.

function bool(value: string | undefined, fallback = false): boolean {
  if (value === undefined) return fallback;
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

function int(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

function list(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export const isProd = process.env.NODE_ENV === "production";

/** Origins allowed to call our API routes (CSRF / cross-site abuse defense). */
export const ALLOWED_ORIGINS: string[] = (() => {
  const configured = list(process.env.ALLOWED_ORIGINS);
  if (configured.length > 0) return configured;
  if (isProd) {
    console.warn(
      "[security] ALLOWED_ORIGINS is not set in production — API routes fall back to same-origin-only."
    );
  }
  return isProd ? [] : ["http://localhost:3000", "http://127.0.0.1:3000"];
})();

export const security = {
  /**
   * Header the trusted proxy uses to convey the real client IP. Empty string
   * disables platform-header trust entirely (use when no proxy is in front).
   */
  ipHeader: process.env.IP_HEADER ?? "do-connecting-ip",
} as const;

export const segurosCaracas = {
  /** Base URL of the Seguros Caracas web service. No default — must be set. */
  baseUrl: (process.env.SC_BASE_URL ?? "").replace(/\/+$/, ""),
  /** Broker credentials — injected server-side, never shipped to the browser. */
  productor: process.env.SC_PRODUCTOR ?? "",
  convenio: process.env.SC_CONVENIO ?? "",
  /** Shared secret required for sensitive operations (suscribir / consultarCliente). */
  proxyToken: process.env.SC_PROXY_TOKEN ?? "",
  /** Master switch. When false the proxy returns 503 for every route. */
  enabled: bool(process.env.SC_PROXY_ENABLED, !isProd),
  /** Upstream request timeout. */
  timeoutMs: int(process.env.SC_TIMEOUT_MS, 12_000),
  /** Max upstream response size we will buffer (bytes) — anti memory-exhaustion. */
  maxResponseBytes: int(process.env.SC_MAX_RESPONSE_BYTES, 2_000_000),
} as const;

export const rateLimit = {
  /** Requests allowed per window, per client IP, for catalog (GET) routes. */
  catalogMax: int(process.env.RL_CATALOG_MAX, 60),
  /** Requests allowed per window, per client IP, for sensitive routes. */
  sensitiveMax: int(process.env.RL_SENSITIVE_MAX, 10),
  /** Window length in milliseconds. */
  windowMs: int(process.env.RL_WINDOW_MS, 60_000),
} as const;
