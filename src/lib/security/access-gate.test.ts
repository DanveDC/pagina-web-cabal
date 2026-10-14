import { test } from "node:test";
import assert from "node:assert/strict";
import { protectedKind, accessToken, safeEqual } from "./access-gate";

test("protectedKind covers the emission page and its APIs only", () => {
  assert.equal(protectedKind("/emitir"), "page");
  assert.equal(protectedKind("/emitir/x"), "page");
  assert.equal(protectedKind("/api/emitir/hogar"), "api");
  assert.equal(protectedKind("/api/consultar-cliente"), "api");
  assert.equal(protectedKind("/emitirx"), null);
  assert.equal(protectedKind("/"), null);
  assert.equal(protectedKind("/cotizar"), null);
});

test("accessToken is a stable HMAC that never contains the key", async () => {
  const a = await accessToken("clave-secreta");
  assert.equal(a, await accessToken("clave-secreta"));
  assert.notEqual(a, await accessToken("otra"));
  assert.match(a, /^[0-9a-f]{64}$/);
  assert.ok(!a.includes("clave"));
});

test("safeEqual", () => {
  assert.ok(safeEqual("abc", "abc"));
  assert.ok(!safeEqual("abc", "abd"));
  assert.ok(!safeEqual("abc", "abcd"));
  assert.ok(!safeEqual("", "a"));
});
