import { test } from "node:test";
import assert from "node:assert/strict";
import { monedaLabel, formatPrima, frecuenciaLabel, CODIGOS_FRECUENCIA, CODIGOS_MONEDA } from "./sc-moneda";

test("cdMoneda 01 = Bs., 02 = USD; unknown codes stay visible", () => {
  assert.equal(monedaLabel("01"), "Bs.");
  assert.equal(monedaLabel("02"), "USD");
  assert.equal(monedaLabel("07"), "Moneda 07");
  assert.match(formatPrima("02", 50), /^USD 50,00$/);
  assert.match(formatPrima("99", 1234.5), /^Moneda 99 1\.234,50$/);
});

test("frequencies confirmed by SC: A, S, C, T", () => {
  assert.deepEqual(CODIGOS_FRECUENCIA, ["A", "S", "C", "T"]);
  assert.equal(frecuenciaLabel("C"), "Cuatrimestral");
  assert.equal(frecuenciaLabel("s"), "Semestral");
  assert.equal(frecuenciaLabel("X", "Otra"), "Otra");
  assert.deepEqual(CODIGOS_MONEDA, ["01", "02"]);
});
