// Run with:  npm test   (Node's built-in test runner, no deps)
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  onlyDigits,
  cleanCode,
  cleanText,
  isValidDateDMY,
  checkCiudadesQuery,
  checkClienteQuery,
  validatePersona,
  validateInmueble,
  buildSuscribirPayload,
  sanitizePersonaField,
} from "./seguros-caracas";
import { PERSONA_EMPTY, type HogarFormState } from "@/types/seguros-caracas";

test("onlyDigits strips non-digits and caps length", () => {
  assert.equal(onlyDigits("V-12.345.678", 12), "12345678");
  assert.equal(onlyDigits("0412-555-1234", 4), "0412");
  assert.equal(onlyDigits("abc", 12), "");
});

test("cleanCode keeps alphanumerics only", () => {
  assert.equal(cleanCode(" AB01x "), "AB01x");
  assert.equal(cleanCode("AB_01-x"), "AB01x");
  assert.equal(cleanCode("../../etc"), "etc");
  assert.equal(cleanCode("a b;c"), "abc");
});

test("cleanText collapses whitespace and trims", () => {
  assert.equal(cleanText("  hola   mundo  "), "hola mundo");
  assert.equal(cleanText("x".repeat(200), 10), "xxxxxxxxxx");
});

test("isValidDateDMY accepts real dates, rejects junk", () => {
  assert.equal(isValidDateDMY("29/02/2024"), true); // leap year
  assert.equal(isValidDateDMY("29/02/2023"), false); // not a leap year
  assert.equal(isValidDateDMY("31/04/2020"), false); // April has 30
  assert.equal(isValidDateDMY("1/1/2020"), false); // needs DD/MM/YYYY
  assert.equal(isValidDateDMY("12/13/2020"), false); // month 13
  assert.equal(isValidDateDMY("15/06/1850"), false); // too old
});

test("checkCiudadesQuery sanitises then validates", () => {
  const ok = checkCiudadesQuery(" 01 ");
  assert.equal(ok.ok, true);
  assert.deepEqual(ok.ok && ok.params, { cdEstado: "01" });

  assert.equal(checkCiudadesQuery("").ok, false);
  assert.equal(checkCiudadesQuery("a".repeat(50)).ok, true); // clamped to 24 -> still valid code
  assert.equal(checkCiudadesQuery("no spaces here").ok, true); // spaces stripped -> "nospaceshere"
});

test("checkClienteQuery enforces nacionalidad enum + numeric id", () => {
  assert.equal(checkClienteQuery("v", "12.345.678").ok, true);
  assert.equal(checkClienteQuery("Z", "12345678").ok, false);
  assert.equal(checkClienteQuery("V", "abc").ok, false);
  assert.equal(checkClienteQuery("V", "123").ok, false); // < 4 digits
});

test("sanitizePersonaField strips per field", () => {
  assert.equal(sanitizePersonaField("cedulaRif", "V-12.345.678"), "12345678");
  assert.equal(sanitizePersonaField("nuTlf", "555 12 34"), "5551234");
  assert.equal(sanitizePersonaField("email", "  a@b.com  "), "a@b.com");
  assert.equal(sanitizePersonaField("feNacimiento", "01/01/1990abc"), "01/01/1990");
});

test("validatePersona flags a natural person's missing fields", () => {
  const e = validatePersona({ ...PERSONA_EMPTY }); // nacionalidad "" -> treated as natural
  assert.ok(e.nacionalidad, "nacionalidad required");
  assert.ok(e.cedulaRif, "cedula required");
  assert.ok(e.nombres, "nombres required for a natural person");
  assert.ok(e.apellidosRazonSocial, "apellidos required");
  assert.ok(e.email, "email required");
  assert.ok(e.sexo && e.edoCivil && e.feNacimiento && e.direccion && e.cdAreaTlf && e.nuTlf);
});

test("validatePersona passes a complete natural person", () => {
  const e = validatePersona({
    ...PERSONA_EMPTY,
    nacionalidad: "V",
    cedulaRif: "12345678",
    nombres: "Ana",
    apellidosRazonSocial: "Pérez",
    sexo: "F",
    edoCivil: "S",
    feNacimiento: "10/05/1990",
    email: "ana@example.com",
    direccion: "Av. Principal, casa 4",
    cdAreaTlf: "212",
    nuTlf: "5551234",
  });
  assert.deepEqual(e, {});
});

test("validatePersona is lenient for persona jurídica (J)", () => {
  const e = validatePersona({
    ...PERSONA_EMPTY,
    nacionalidad: "J",
    cedulaRif: "312345678",
    apellidosRazonSocial: "ACME C.A.",
    email: "info@acme.com",
    direccion: "Zona Industrial",
    cdAreaTlf: "212",
    nuTlf: "5551234",
  });
  assert.equal(e.sexo, undefined);
  assert.equal(e.feNacimiento, undefined);
  assert.equal(e.edoCivil, undefined);
  assert.deepEqual(e, {});
});

test("validateInmueble requires the key selects and address", () => {
  const e = validateInmueble({
    cdEstado: "", deEstado: "", cdCiudad: "", deCiudad: "",
    cdSector: "", deSector: "", cdPostal: "", x: "", y: "",
    cdIndole: "", deInmueble: "", deCalle: "", deDireccion1: "", deDireccion2: "",
  });
  assert.ok(e.cdEstado && e.cdCiudad && e.cdSector && e.cdIndole && e.deInmueble && e.deDireccion1);
});

const validForm = (): HogarFormState => ({
  inmueble: {
    cdEstado: "01", deEstado: "DISTRITO CAPITAL",
    cdCiudad: "0101", deCiudad: "CARACAS",
    cdSector: "010101", deSector: "EL ROSAL",
    cdPostal: "1060", x: "10.5", y: "-66.9",
    cdIndole: "1", deInmueble: "Torre B Apto 4C", deCalle: "Av. Principal",
    deDireccion1: "Av. Principal con calle 2", deDireccion2: "",
  },
  asegurado: {
    ...PERSONA_EMPTY, nacionalidad: "V", cedulaRif: "12345678",
    nombres: "Ana", apellidosRazonSocial: "Pérez", sexo: "F", edoCivil: "S",
    feNacimiento: "10/05/1990", email: "ana@example.com",
    direccion: "Av. Principal casa 4", cdAreaTlf: "212", nuTlf: "5551234",
  },
  tomadorIgualAsegurado: true,
  tomador: { ...PERSONA_EMPTY },
});

test("buildSuscribirPayload returns a schema-valid payload for a good form", () => {
  const r = buildSuscribirPayload(validForm(), { cdOpcion: 1, cdMoneda: "USD", frPago: "A" });
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.payload.pedido.asegurado.cedulaRif, 12345678); // coerced to number
    assert.equal(typeof r.payload.pedido.hogar.cdEstado, "string");
    // broker ids must NOT be present (server injects them)
    assert.equal("cdProductor" in r.payload.pedido, false);
  }
});

test("buildSuscribirPayload rejects an incomplete form with field errors", () => {
  const bad = validForm();
  bad.asegurado.cedulaRif = "12"; // too short
  bad.inmueble.cdSector = "";
  const r = buildSuscribirPayload(bad, { cdOpcion: 1, cdMoneda: "USD", frPago: "A" });
  assert.equal(r.ok, false);
  if (!r.ok) {
    assert.ok(r.errors.asegurado.cedulaRif);
    assert.ok(r.errors.inmueble.cdSector);
  }
});

test("buildSuscribirPayload sanitises dirty input before building", () => {
  const dirty = validForm();
  dirty.asegurado.cedulaRif = "V-12.345.678";
  dirty.asegurado.nombres = "  Ana   María  ";
  dirty.inmueble.deDireccion1 = "x".repeat(80);
  const r = buildSuscribirPayload(dirty, { cdOpcion: 1, cdMoneda: "USD", frPago: "A" });
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.payload.pedido.asegurado.cedulaRif, 12345678);
    assert.equal(r.payload.pedido.asegurado.nombres, "Ana María");
    assert.equal(r.payload.pedido.hogar.deDireccion1.length, 50);
  }
});
