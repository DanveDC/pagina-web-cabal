import { test } from "node:test";
import assert from "node:assert/strict";
import {
  consumeDailyEmission,
  caracasDayKey,
  msUntilCaracasMidnight,
  __resetDailyEmissions,
} from "./daily-cap";

test("daily cap allows N emissions, blocks N+1, resets the next Caracas day", () => {
  __resetDailyEmissions();
  const t0 = Date.UTC(2026, 9, 14, 15, 0, 0); // 11:00 Caracas
  for (let i = 0; i < 5; i++) assert.ok(consumeDailyEmission(5, t0 + i).ok);
  const blocked = consumeDailyEmission(5, t0 + 10);
  assert.equal(blocked.ok, false);
  assert.ok(blocked.retryAfterSec > 0);
  const nextDay = Date.UTC(2026, 9, 15, 4, 0, 1); // 00:00:01 Caracas next day
  assert.ok(consumeDailyEmission(5, nextDay).ok);
});

test("Caracas day boundaries (UTC-4)", () => {
  assert.equal(caracasDayKey(Date.UTC(2026, 9, 15, 3, 59, 59)), "2026-10-14");
  assert.equal(caracasDayKey(Date.UTC(2026, 9, 15, 4, 0, 0)), "2026-10-15");
  assert.equal(msUntilCaracasMidnight(Date.UTC(2026, 9, 15, 3, 0, 0)), 3_600_000);
});
