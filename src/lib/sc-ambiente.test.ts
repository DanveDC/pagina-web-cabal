// Run with:  npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseScAmbiente } from "./sc-ambiente";

test("parseScAmbiente defaults to pruebas", () => {
  for (const v of [undefined, null, "", "   ", "staging", "prod", "true"]) {
    assert.equal(parseScAmbiente(v as string | undefined), "pruebas");
  }
});

test("parseScAmbiente accepts produccion case/whitespace-insensitively", () => {
  for (const v of ["produccion", "PRODUCCION ", " Produccion"]) {
    assert.equal(parseScAmbiente(v), "produccion");
  }
});

test("parseScAmbiente accepts pruebas", () => {
  assert.equal(parseScAmbiente("pruebas"), "pruebas");
});
