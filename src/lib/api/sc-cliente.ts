// Normalises consultarCliente answers into the persona form.
// The spec (§6) shows a flat object (nombres, apellidosRazonSocial, sexo "M",
// edoCivil "S", feNacimiento "31/03/2002"); sasweb-test actually returns
// (verified 13/11/2026) nmPersonaNatural, nmApellidoRazon, sexo.rvLowValue,
// estadoCivil.rvLowValue, feNacimiento "1938-09-16T04:30:00Z[UTC]", plus
// contact data (emailHabitacion, cdAreaHab1, nuTelfHab1, diHabitacion1,
// estadoHabitacion, ciudadHabitacion). Both shapes are accepted.

import type { PersonaFormState } from "@/types/seguros-caracas";

type Raw = Record<string, unknown>;

const str = (v: unknown): string =>
  typeof v === "string" ? v.trim() : typeof v === "number" && Number.isFinite(v) ? String(v) : "";

/** Value of a plain string or of an SC code object ({ rvLowValue } / { codigo, descripcion }). */
const code = (v: unknown): string => {
  if (v && typeof v === "object") {
    const o = v as Raw;
    return str(o.rvLowValue ?? o.codigo);
  }
  return str(v);
};
const desc = (v: unknown): string =>
  v && typeof v === "object" ? str((v as Raw).descripcion) : str(v);

/** "31/03/2002" stays; "1938-09-16T04:30:00Z[UTC]" → "16/09/1938" (calendar date as sent). */
export function fechaClienteDMY(v: unknown): string {
  const s = str(v);
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : "";
}

export function normalizeCliente(raw: unknown): Partial<PersonaFormState> {
  if (!raw || typeof raw !== "object") return {};
  const c = raw as Raw;
  const out: Partial<PersonaFormState> = {
    nombres: str(c.nombres) || str(c.nmPersonaNatural),
    apellidosRazonSocial: str(c.apellidosRazonSocial) || str(c.nmApellidoRazon),
    sexo: code(c.sexo) as PersonaFormState["sexo"],
    edoCivil: code(c.edoCivil) || code(c.estadoCivil),
    feNacimiento: fechaClienteDMY(c.feNacimiento),
    email: str(c.email) || str(c.emailHabitacion),
    direccion: str(c.direccion) || str(c.diHabitacion1),
    estado: str(c.estado) || desc(c.estadoHabitacion),
    ciudad: str(c.ciudad) || desc(c.ciudadHabitacion),
  };
  const area = str(c.cdAreaTlf) || str(c.cdAreaHab1);
  if (area) out.cdAreaTlf = area.startsWith("0") ? area : `0${area}`;
  const tlf = str(c.nuTlf) || str(c.nuTelfHab1);
  if (tlf) out.nuTlf = tlf;
  // Drop empty values so a lookup never blanks what the user already typed.
  for (const k of Object.keys(out) as (keyof PersonaFormState)[]) if (!out[k]) delete out[k];
  return out;
}
