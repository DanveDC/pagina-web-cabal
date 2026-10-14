// Pure module (no server-only import) so it can be unit-tested with node:test.
// ─── Global daily cap (all IPs) ─────────────────────────────────────────────
// In-memory, single instance; resets on redeploy. Day boundaries follow
// America/Caracas (UTC-4, no DST).

const CARACAS_OFFSET_MS = -4 * 60 * 60 * 1000;

export function caracasDayKey(now: number): string {
  return new Date(now + CARACAS_OFFSET_MS).toISOString().slice(0, 10);
}

/** Milliseconds until the next Caracas midnight. */
export function msUntilCaracasMidnight(now: number): number {
  const local = now + CARACAS_OFFSET_MS;
  const nextMidnight = Math.floor(local / 86_400_000) * 86_400_000 + 86_400_000;
  return nextMidnight - local;
}

const daily = { day: "", count: 0, warned: false, alerted: false };

export interface DailyCapResult {
  ok: boolean;
  count: number;
  max: number;
  retryAfterSec: number;
}

/** Consume one emission from today's global budget. */
export function consumeDailyEmission(max: number, now: number = Date.now()): DailyCapResult {
  const day = caracasDayKey(now);
  if (daily.day !== day) {
    daily.day = day;
    daily.count = 0;
    daily.warned = false;
    daily.alerted = false;
  }
  const retryAfterSec = Math.max(1, Math.ceil(msUntilCaracasMidnight(now) / 1000));
  if (daily.count >= max) {
    if (!daily.alerted) {
      daily.alerted = true;
      console.error(`[ALERTA-EMISION] Tope diario alcanzado (${max}). Emisiones bloqueadas hasta medianoche (Caracas).`);
    }
    return { ok: false, count: daily.count, max, retryAfterSec };
  }
  daily.count += 1;
  if (!daily.warned && daily.count >= Math.ceil(max * 0.8)) {
    daily.warned = true;
    console.warn(`[ALERTA-EMISION] ${daily.count}/${max} emisiones hoy (80% del tope diario).`);
  }
  return { ok: true, count: daily.count, max, retryAfterSec };
}

/** Test helper. */
export function __resetDailyEmissions(): void {
  daily.day = "";
  daily.count = 0;
  daily.warned = false;
  daily.alerted = false;
}
