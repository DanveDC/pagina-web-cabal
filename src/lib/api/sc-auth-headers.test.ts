import { test } from "node:test";
import assert from "node:assert/strict";
import { scAuthHeaders, isJsonContentType } from "./sc-auth-headers";

test("both SC credentials go as x-api-key and x-secret-id", () => {
  assert.deepEqual(scAuthHeaders({ apiKey: " k ", secretId: "s" }), { "x-api-key": "k", "x-secret-id": "s" });
});

test("missing either credential → not configured (SC would answer 401)", () => {
  assert.equal(scAuthHeaders({ apiKey: "", secretId: "s" }), null);
  assert.equal(scAuthHeaders({ apiKey: "k", secretId: "  " }), null);
});

test("problem+json counts as JSON", () => {
  assert.ok(isJsonContentType("application/json; charset=utf-8"));
  assert.ok(isJsonContentType("application/problem+json"));
  assert.ok(!isJsonContentType("text/html"));
});
