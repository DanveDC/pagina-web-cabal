import "server-only";
import { security } from "./env";

// ─── In-memory fixed-window rate limiter ────────────────────────────────────
// Single-instance only. For a horizontally-scaled deployment, back this with
// Redis / Upstash (same interface). DigitalOcean App Platform single-instance
// is fine for launch; see DEPLOYMENT.md.

type Bucket = { count: number; resetAt: number };

const store = new Map<string, Bucket>();

// Hard ceiling so a flood of distinct keys cannot exhaust memory. When full we
// drop the oldest-expiring bucket (best effort — Map preserves insertion order,
// and buckets are inserted in roughly resetAt order).
const MAX_KEYS = 50_000;

let lastSweep = 0;
function sweep(now: number) {
  if (now - lastSweep < 15_000) return;
  lastSweep = now;
  for (const [key, bucket] of store) {
    if (bucket.resetAt <= now) store.delete(key);
  }
}

export interface RateLimitResult {
  ok: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSec: number;
}

export function rateLimit(key: string, max: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  sweep(now);

  let bucket = store.get(key);
  if (!bucket || bucket.resetAt <= now) {
    if (store.size >= MAX_KEYS) {
      const oldest = store.keys().next().value;
      if (oldest !== undefined) store.delete(oldest);
    }
    bucket = { count: 0, resetAt: now + windowMs };
    store.set(key, bucket);
  }

  bucket.count += 1;
  const remaining = Math.max(0, max - bucket.count);
  const ok = bucket.count <= max;

  return {
    ok,
    limit: max,
    remaining,
    resetAt: bucket.resetAt,
    retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
  };
}

/**
 * Client IP for rate-limit keying.
 *
 * A client-supplied `X-Forwarded-For` cannot be trusted: DigitalOcean App
 * Platform (and most L7 proxies) *append* the real edge IP rather than replace
 * the header, so the LEFTMOST entry is attacker-controlled. We therefore:
 *   1. Prefer an explicit platform header (`IP_HEADER`, default `do-connecting-ip`).
 *   2. Else take the RIGHTMOST `X-Forwarded-For` entry — the hop added by the
 *      trusted proxy directly in front of us.
 * If the app is ever exposed with no proxy in front, set IP_HEADER="" and the
 * key falls back to a constant (fail-safe: everyone shares one bucket).
 */
export function clientIp(req: Request): string {
  const h = req.headers;

  if (security.ipHeader) {
    const direct = h.get(security.ipHeader);
    if (direct) return direct.split(",").pop()!.trim();
  }

  const xff = h.get("x-forwarded-for");
  if (xff) {
    const parts = xff.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length > 0) return parts[parts.length - 1]!;
  }

  return h.get("x-real-ip") ?? h.get("cf-connecting-ip") ?? "no-ip";
}
