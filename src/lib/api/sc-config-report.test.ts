import { test } from "node:test";
import assert from "node:assert/strict";
import { scConfigProblems } from "./sc-config-report";

const ok = {
  proxyEnabledRaw: "true", baseUrl: "https://sasweb-test.seguroscaracas.com",
  productor: "10820", convenio: "103", apiKey: "k", secretId: "s", proxyToken: "t",
};

test("complete config has no problems", () => {
  assert.deepEqual(scConfigProblems(ok), []);
});

test("quoted true, quoted URL and missing keys are named (never values)", () => {
  const p = scConfigProblems({ ...ok, proxyEnabledRaw: '"true"', baseUrl: '"https://x.com"', apiKey: "", secretId: "" });
  assert.equal(p.length, 4);
  assert.ok(p.some((x) => x.startsWith("SC_PROXY_ENABLED")));
  assert.ok(p.some((x) => x.startsWith("SC_BASE_URL")));
  assert.ok(p.includes("SC_API_KEY (vacía)") && p.includes("SC_SECRET_ID (vacía)"));
  assert.ok(!p.join(" ").includes("https://x.com"));
});
