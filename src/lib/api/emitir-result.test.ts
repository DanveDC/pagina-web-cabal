// Run with:  npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  classifyEmitirResult,
  sanitizeDeError,
  describeScError,
  formatPolizaText,
} from "./emitir-result";

const POLIZA = { cdRamo: 10, cdSucursal: 2, nuPoliza: 12345, nuRecibo: 678 };

test("classify: success when cdError 0 and poliza present", () => {
  const r = classifyEmitirResult(200, { cdError: 0, poliza: POLIZA });
  assert.equal(r.ok, true);
  if (r.ok) assert.deepEqual(r.poliza, POLIZA);
});

test("classify: cdError != 0 on HTTP 200 -> 422 sc_rejected with deError", () => {
  const r = classifyEmitirResult(200, { cdError: 5, deError: "Cliente inválido" });
  assert.equal(r.ok, false);
  if (!r.ok) {
    assert.equal(r.status, 422);
    assert.equal(r.code, "sc_rejected");
    assert.equal(r.deError, "Cliente inválido");
    assert.equal(r.message, "Cliente inválido");
  }
});

test("classify: cdError != 0 with empty deError falls back to generic message", () => {
  const r = classifyEmitirResult(200, { cdError: 5, deError: "" });
  assert.equal(r.ok, false);
  if (!r.ok) {
    assert.equal(r.status, 422);
    assert.ok(r.message.length > 0);
  }
});

test("classify: HTML / empty / non-object bodies -> 502", () => {
  for (const body of [null, undefined, "", "<html>x</html>", 42, []]) {
    const r = classifyEmitirResult(200, body);
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.status, 502);
  }
});

test("classify: cdError 0 without poliza -> invalid_response", () => {
  const r = classifyEmitirResult(200, { cdError: 0 });
  assert.equal(r.ok, false);
  if (!r.ok) {
    assert.equal(r.status, 502);
    assert.equal(r.code, "invalid_response");
  }
});

test("classify: cdError 0 with incomplete poliza -> invalid_response", () => {
  const r = classifyEmitirResult(200, { cdError: 0, poliza: { cdRamo: 1 } });
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.code, "invalid_response");
});

test("classify: cdError string '0' or missing is not success", () => {
  const a = classifyEmitirResult(200, { cdError: "0", poliza: POLIZA });
  assert.equal(a.ok, false);
  const b = classifyEmitirResult(200, { poliza: POLIZA });
  assert.equal(b.ok, false);
  if (!b.ok) assert.equal(b.code, "invalid_response");
});

test("classify: upstream 500 stays non-2xx", () => {
  const r = classifyEmitirResult(500, { cdError: 0, poliza: POLIZA });
  assert.equal(r.ok, false);
  if (!r.ok) assert.ok(r.status >= 400);
});

test("classify: string error code keeps upstream status when >= 400, else 502", () => {
  const a = classifyEmitirResult(429, { error: "rate_limited" });
  assert.equal(a.ok, false);
  if (!a.ok) {
    assert.equal(a.status, 429);
    assert.equal(a.code, "rate_limited");
  }
  const b = classifyEmitirResult(200, { error: "upstream_timeout" });
  assert.equal(b.ok, false);
  if (!b.ok) assert.equal(b.status, 502);
});

test("sanitizeDeError strips markup, control chars, caps length", () => {
  assert.equal(sanitizeDeError("<script>x</script>"), "x");
  assert.equal(sanitizeDeError("a\u0000b\u0007c\u009fd"), "abcd");
  assert.equal(sanitizeDeError("  a \n\t b  "), "a b");
  const long = sanitizeDeError("x".repeat(500));
  assert.equal(long.length, 301);
  assert.ok(long.endsWith("…"));
  assert.equal(sanitizeDeError(""), "");
  assert.equal(sanitizeDeError(null), "");
  assert.equal(sanitizeDeError(123), "");
});

test("describeScError maps known codes to Spanish without raw code", () => {
  const codes = [
    "service_disabled",
    "rate_limited",
    "forbidden_origin",
    "unauthorized",
    "credentials_not_configured",
    "upstream_unreachable",
    "upstream_timeout",
    "upstream_bad_response",
    "upstream_response_too_large",
    "invalid_parameters",
    "invalid_json",
    "payload_too_large",
    "unsupported_media_type",
    "invalid_request",
    "network_error",
    "aborted",
    "invalid_response",
    "sc_rejected",
  ];
  const seen = new Set<string>();
  for (const c of codes) {
    const m = describeScError(c);
    assert.ok(m.length > 10, c);
    assert.ok(!m.includes(c), `raw code leaked: ${c}`);
    seen.add(m);
  }
  assert.ok(seen.has(describeScError("service_disabled")));
  assert.notEqual(describeScError("service_disabled"), describeScError("rate_limited"));
  assert.notEqual(describeScError("forbidden_origin"), describeScError("unauthorized"));
});

test("describeScError: unknown and http_* codes -> generic message", () => {
  const g = describeScError("xyz");
  assert.ok(g.length > 10);
  assert.ok(!g.includes("xyz"));
  assert.equal(describeScError("http_500"), g);
});

test("formatPolizaText includes the 4 fields, date/time and ambiente", () => {
  const at = new Date("2026-03-04T15:30:00Z"); // 11:30 in America/Caracas (UTC-4)
  const t = formatPolizaText(POLIZA, at, "pruebas");
  for (const v of ["10", "2", "12345", "678"]) assert.ok(t.includes(v), v);
  assert.ok(t.includes("04/03/2026"), t);
  assert.ok(/11:30/.test(t), t);
  assert.ok(/PRUEBAS/i.test(t));
  const p = formatPolizaText(POLIZA, at, "produccion");
  assert.ok(!/PRUEBAS/i.test(p));
});

test("classify is idempotent over the route's sc_rejected body", () => {
  const r = classifyEmitirResult(422, {
    error: "sc_rejected",
    cdError: 5,
    deError: "Cliente inválido",
  });
  assert.equal(r.ok, false);
  if (!r.ok) {
    assert.equal(r.status, 422);
    assert.equal(r.message, "Cliente inválido");
  }
});
