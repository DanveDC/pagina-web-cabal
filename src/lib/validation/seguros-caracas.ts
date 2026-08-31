// ─── Client-side validation & sanitisation for Seguros Caracas ──────────────
// Runs in the browser BEFORE any request leaves the app: strips junk, checks
// formats, and returns friendly (es-VE) messages. The server proxy re-validates
// everything with the Zod schemas in seguros-caracas.schema.ts — this layer is
// for UX and to never send a request we already know is malformed.

import { catalogQuery, suscribirBody } from "@/lib/api/seguros-caracas.schema";
import {
  toSuscribirPersona,
  type PersonaFormState,
  type HogarFormState,
  type SuscribirRequest,
} from "@/types/seguros-caracas";

// ── sanitisers ─────────────────────────────────────────────────────────────

export const onlyDigits = (v: string, max = 32): string => v.replace(/\D+/g, "").slice(0, max);

/** Trim, collapse internal whitespace, cap length. */
export const cleanText = (v: string, max = 120): string =>
  v.replace(/\s+/g, " ").trim().slice(0, max);

/** SC catalog codes are alphanumeric only. */
export const cleanCode = (v: string, max = 24): string =>
  v.trim().replace(/[^A-Za-z0-9]+/g, "").slice(0, max);

export const cleanEmail = (v: string): string => v.trim().replace(/\s+/g, "").slice(0, 120);

/** True for a real calendar date written DD/MM/YYYY (year 1900..now+1). */
export function isValidDateDMY(s: string): boolean {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s.trim());
  if (!m) return false;
  const [, dd, mm, yyyy] = m.map(Number) as unknown as [string, number, number, number];
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return false;
  const d = new Date(yyyy, mm - 1, dd);
  if (d.getFullYear() !== yyyy || d.getMonth() !== mm - 1 || d.getDate() !== dd) return false;
  const now = new Date().getFullYear();
  return yyyy >= 1900 && yyyy <= now + 1;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// ── query-param validation (used by the API client before fetch) ───────────

export type QueryCheck = { ok: true; params: Record<string, string> } | { ok: false; reason: string };

export function checkCiudadesQuery(cdEstado: string): QueryCheck {
  const parsed = catalogQuery.ciudades.safeParse({ cdEstado: cleanCode(cdEstado) });
  return parsed.success
    ? { ok: true, params: parsed.data as Record<string, string> }
    : { ok: false, reason: "cdEstado inválido" };
}

export function checkSectoresQuery(cdEstado: string, cdCiudad: string): QueryCheck {
  const parsed = catalogQuery.sectores.safeParse({
    cdEstado: cleanCode(cdEstado),
    cdCiudad: cleanCode(cdCiudad),
  });
  return parsed.success
    ? { ok: true, params: parsed.data as Record<string, string> }
    : { ok: false, reason: "estado/ciudad inválidos" };
}

export function checkClienteQuery(nacionalidad: string, cedulaRif: string): QueryCheck {
  const parsed = catalogQuery.cliente.safeParse({
    nacionalidad: nacionalidad.trim().toUpperCase(),
    cedulaRif: onlyDigits(cedulaRif, 12),
  });
  return parsed.success
    ? { ok: true, params: parsed.data as Record<string, string> }
    : { ok: false, reason: "nacionalidad o cédula/RIF inválidos" };
}

// ── form-field validation (used by the cotizar UI for inline errors) ───────

export type FieldErrors<T extends string> = Partial<Record<T, string>>;
export type PersonaField = keyof PersonaFormState;
export type InmuebleField = keyof HogarFormState["inmueble"];

export function hasErrors(e: Record<string, string | undefined>): boolean {
  return Object.values(e).some(Boolean);
}

/** Sanitise a single persona field as the user types. */
export function sanitizePersonaField(k: PersonaField, v: string): string {
  switch (k) {
    case "cedulaRif":
      return onlyDigits(v, 12);
    case "nuTlf":
      return onlyDigits(v, 12);
    case "cdAreaTlf":
      return onlyDigits(v, 4);
    case "email":
      return cleanEmail(v);
    case "feNacimiento":
      return v.replace(/[^\d/]/g, "").slice(0, 10);
    default:
      return v.slice(0, 120);
  }
}

export function sanitizeInmuebleField(k: InmuebleField, v: string): string {
  switch (k) {
    case "cdPostal":
      return onlyDigits(v, 10);
    case "x":
    case "y":
      return v.replace(/[^\d.-]/g, "").slice(0, 24);
    case "deDireccion1":
    case "deDireccion2":
      return v.slice(0, 50);
    default:
      return v.slice(0, 120);
  }
}

/** Validate a person. `role` tweaks messages; `required` gates empties. */
export function validatePersona(p: PersonaFormState): FieldErrors<PersonaField> {
  const e: FieldErrors<PersonaField> = {};
  const juridica = p.nacionalidad === "J" || p.nacionalidad === "G";

  if (!["V", "E", "J", "G"].includes(p.nacionalidad)) e.nacionalidad = "Seleccioná la nacionalidad";

  if (onlyDigits(p.cedulaRif, 12).length < 4)
    e.cedulaRif = "Ingresá la cédula o RIF (solo números, 4 a 12 dígitos)";

  if (!juridica && !cleanText(p.nombres, 120)) e.nombres = "Requerido";
  if (!cleanText(p.apellidosRazonSocial, 120)) e.apellidosRazonSocial = "Requerido";

  if (!juridica) {
    if (!["M", "F"].includes(p.sexo)) e.sexo = "Seleccioná el sexo";
    if (!p.edoCivil) e.edoCivil = "Seleccioná el estado civil";
    if (!p.feNacimiento) e.feNacimiento = "Requerida (DD/MM/YYYY)";
    else if (!isValidDateDMY(p.feNacimiento)) e.feNacimiento = "Fecha inválida — usá DD/MM/YYYY";
  } else if (p.feNacimiento && !isValidDateDMY(p.feNacimiento)) {
    e.feNacimiento = "Fecha inválida — usá DD/MM/YYYY";
  }

  if (!p.email) e.email = "Requerido";
  else if (!EMAIL_RE.test(p.email)) e.email = "Correo inválido";

  if (!cleanText(p.direccion, 120)) e.direccion = "Requerida";

  if (!onlyDigits(p.cdAreaTlf, 4)) e.cdAreaTlf = "Cód. área";
  if (onlyDigits(p.nuTlf, 12).length < 7) e.nuTlf = "Teléfono inválido (mín. 7 dígitos)";

  return e;
}

export function validateInmueble(i: HogarFormState["inmueble"]): FieldErrors<InmuebleField> {
  const e: FieldErrors<InmuebleField> = {};
  if (!i.cdEstado) e.cdEstado = "Seleccioná el estado";
  if (!i.cdCiudad) e.cdCiudad = "Seleccioná la ciudad";
  if (!i.cdSector) e.cdSector = "Seleccioná el sector";
  if (!i.cdIndole) e.cdIndole = "Seleccioná la índole del inmueble";
  if (!cleanText(i.deInmueble, 120)) e.deInmueble = "Requerido";
  if (!cleanText(i.deCalle, 120)) e.deCalle = "Requerida";
  // deDireccion1/2 are clamped to 50 chars at input time (sanitizeInmuebleField).
  if (!i.deDireccion1.trim()) e.deDireccion1 = "Requerida (máx. 50)";
  return e;
}

// ── full-form gate: sanitised, validated, schema-checked payload ───────────

export interface HogarValidationErrors {
  inmueble: FieldErrors<InmuebleField>;
  asegurado: FieldErrors<PersonaField>;
  tomador: FieldErrors<PersonaField>;
  form?: string;
}

export type BuildResult =
  | { ok: true; payload: SuscribirRequest }
  | { ok: false; errors: HogarValidationErrors };

/**
 * Produce a wire-ready SuscribirRequest from the form, or a structured error
 * map. Runs the same Zod schema the server uses as the final gate.
 */
export function buildSuscribirPayload(
  form: HogarFormState,
  pedido: { cdOpcion: number; cdMoneda: string; frPago: string; cdMonedaPago?: string }
): BuildResult {
  // 1. Sanitise everything first.
  const inmueble = sanitizeInmueble(form.inmueble);
  const asegurado = sanitizePersona(form.asegurado);
  const tomador = sanitizePersona(form.tomadorIgualAsegurado ? form.asegurado : form.tomador);

  // 2. Validate the sanitised values.
  const errors: HogarValidationErrors = {
    inmueble: validateInmueble(inmueble),
    asegurado: validatePersona(asegurado),
    tomador: form.tomadorIgualAsegurado ? {} : validatePersona(tomador),
  };
  if (hasErrors(errors.inmueble) || hasErrors(errors.asegurado) || hasErrors(errors.tomador)) {
    return { ok: false, errors };
  }

  // 3. Build and run the wire schema as the final gate.
  const payload: SuscribirRequest = {
    pedido: {
      ...pedido,
      hogar: {
        deEstado: inmueble.deEstado,
        cdEstado: inmueble.cdEstado,
        deCiudad: inmueble.deCiudad,
        cdCiudad: inmueble.cdCiudad,
        deSector: inmueble.deSector,
        cdSector: inmueble.cdSector,
        cdPostal: inmueble.cdPostal,
        deInmueble: inmueble.deInmueble,
        deCalle: inmueble.deCalle,
        x: inmueble.x,
        y: inmueble.y,
        deDireccion1: inmueble.deDireccion1,
        deDireccion2: inmueble.deDireccion2,
        cdIndole: inmueble.cdIndole,
      },
      asegurado: toSuscribirPersona(asegurado),
      tomador: toSuscribirPersona(tomador),
      documentos: [],
      domicilio: { tpCuenta: "", nuCuenta: "", feVencimiento: "", cdBanco: 0 },
    },
  };

  if (!suscribirBody.safeParse(payload).success) {
    return {
      ok: false,
      errors: { ...errors, form: "Revisá los datos: hay campos con formato inválido." },
    };
  }
  return { ok: true, payload };
}

function sanitizeInmueble(i: HogarFormState["inmueble"]): HogarFormState["inmueble"] {
  return {
    deEstado: cleanText(i.deEstado, 120),
    cdEstado: cleanCode(i.cdEstado),
    deCiudad: cleanText(i.deCiudad, 120),
    cdCiudad: cleanCode(i.cdCiudad),
    deSector: cleanText(i.deSector, 120),
    cdSector: cleanCode(i.cdSector),
    cdPostal: onlyDigits(i.cdPostal, 10),
    deInmueble: cleanText(i.deInmueble, 120),
    deCalle: cleanText(i.deCalle, 120),
    x: i.x.replace(/[^\d.-]/g, "").slice(0, 24),
    y: i.y.replace(/[^\d.-]/g, "").slice(0, 24),
    deDireccion1: i.deDireccion1.replace(/\s+/g, " ").trim().slice(0, 50),
    deDireccion2: i.deDireccion2.replace(/\s+/g, " ").trim().slice(0, 50),
    cdIndole: cleanCode(i.cdIndole),
  };
}

function sanitizePersona(p: PersonaFormState): PersonaFormState {
  return {
    ...p,
    nacionalidad: p.nacionalidad.trim().toUpperCase(),
    cedulaRif: onlyDigits(p.cedulaRif, 12),
    nombres: cleanText(p.nombres, 120),
    apellidosRazonSocial: cleanText(p.apellidosRazonSocial, 120),
    edoCivil: p.edoCivil.trim().slice(0, 2),
    feNacimiento: p.feNacimiento.replace(/[^\d/]/g, "").slice(0, 10),
    pais: cleanText(p.pais, 120),
    estado: cleanText(p.estado, 120),
    ciudad: cleanText(p.ciudad, 120),
    email: cleanEmail(p.email),
    direccion: cleanText(p.direccion, 120),
    cdAreaTlf: onlyDigits(p.cdAreaTlf, 4),
    nuTlf: onlyDigits(p.nuTlf, 12),
    profesion: cleanText(p.profesion, 120),
  };
}
