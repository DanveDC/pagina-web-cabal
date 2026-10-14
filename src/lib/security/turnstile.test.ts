import { test } from "node:test";
import assert from "node:assert/strict";
import { verifyTurnstile } from "./turnstile";

const fake = (impl: () => Promise<Response>) => (async () => impl()) as unknown as typeof fetch;
const json = (body: unknown, status = 200) =>
  Promise.resolve(new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } }));

test("turnstile: valid token", async () => {
  assert.deepEqual(await verifyTurnstile("tok", "1.2.3.4", "s", 1000, fake(() => json({ success: true }))), { ok: true });
});
test("turnstile: invalid token", async () => {
  const r = await verifyTurnstile("tok", "1.2.3.4", "s", 1000, fake(() => json({ success: false })));
  assert.deepEqual(r, { ok: false, reason: "invalid_token" });
});
test("turnstile: missing token never calls Cloudflare", async () => {
  let called = false;
  const r = await verifyTurnstile(null, "1.2.3.4", "s", 1000, fake(() => { called = true; return json({}); }));
  assert.deepEqual(r, { ok: false, reason: "missing_token" });
  assert.equal(called, false);
});
test("turnstile: network error fails closed", async () => {
  const r = await verifyTurnstile("tok", "1.2.3.4", "s", 1000, fake(() => Promise.reject(new Error("down"))));
  assert.deepEqual(r, { ok: false, reason: "unavailable" });
});
