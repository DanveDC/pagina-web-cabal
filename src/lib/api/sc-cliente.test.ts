import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeCliente, fechaClienteDMY } from "./sc-cliente";

test("real sasweb-test consultarCliente shape is mapped", () => {
  const real = {
    nmPersonaNatural: "JUAN PEDRO", nmApellidoRazon: "MORALES GUTIERREZ",
    sexo: { disabledIndicador: false, rvLowValue: "M" },
    estadoCivil: { disabledIndicador: false, rvLowValue: "C" },
    feNacimiento: "1938-09-16T04:30:00Z[UTC]",
    emailHabitacion: "a@b.com", cdAreaHab1: 212, nuTelfHab1: 5551234,
    diHabitacion1: "LAS LOMAS 79 ", estadoHabitacion: { codigo: "23", descripcion: "ZULIA" },
    ciudadHabitacion: { codigo: "98", descripcion: "MARACAIBO" },
  };
  assert.deepEqual(normalizeCliente(real), {
    nombres: "JUAN PEDRO", apellidosRazonSocial: "MORALES GUTIERREZ", sexo: "M", edoCivil: "C",
    feNacimiento: "16/09/1938", email: "a@b.com", direccion: "LAS LOMAS 79", estado: "ZULIA",
    ciudad: "MARACAIBO", cdAreaTlf: "0212", nuTlf: "5551234",
  });
});

test("spec (PDF) consultarCliente shape still works", () => {
  const pdf = { apellidosRazonSocial: "MORALES GUTIERREZ", cedulaRif: 99999999, edoCivil: "S", feNacimiento: "31/03/2002", nacionalidad: "V", nombres: "JUAN PEDRO", sexo: "M" };
  const n = normalizeCliente(pdf);
  assert.equal(n.nombres, "JUAN PEDRO");
  assert.equal(n.edoCivil, "S");
  assert.equal(n.feNacimiento, "31/03/2002");
  assert.equal(n.email, undefined);
});

test("fechaClienteDMY", () => {
  assert.equal(fechaClienteDMY("2002-03-31T04:00:00Z[UTC]"), "31/03/2002");
  assert.equal(fechaClienteDMY("basura"), "");
});
