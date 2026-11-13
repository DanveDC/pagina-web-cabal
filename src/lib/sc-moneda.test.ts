import { test } from "node:test";
import assert from "node:assert/strict";
import { monedaLabel, formatPrima, frecuenciaLabel, primaFrecuencia, CODIGOS_FRECUENCIA, CODIGOS_MONEDA } from "./sc-moneda";

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

test("premium per frequency: real sasweb-test shape (mtPrimaBs/mtPrimaUsd) and spec shape (mtPrima)", () => {
  const real = { cdFrPago: "S", deFrPago: "Semestral", mtPrimaBs: 22836.08, mtPrimaUsd: 25.05 };
  assert.equal(primaFrecuencia(real, "02"), 25.05);
  assert.equal(primaFrecuencia(real, "01"), 22836.08);
  assert.equal(primaFrecuencia({ mtPrima: 50 }, "02"), 50);
  assert.equal(primaFrecuencia({}, "02"), undefined);
  assert.equal(formatPrima("02", undefined), "—");
  assert.match(formatPrima("02", primaFrecuencia(real, "02")), /^USD 25,05$/);
});
