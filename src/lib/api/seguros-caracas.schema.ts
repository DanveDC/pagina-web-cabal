import { z } from "zod";

// ─── Request validation for the Seguros Caracas proxy ───────────────────────
// Everything the browser can influence is validated here before it reaches the
// upstream web service. Keep these in sync with src/types/seguros-caracas.ts.

// Codes from SC are short alphanumeric tokens. Reject anything with control
// chars, spaces, or an unreasonable length.
const code = z
  .string()
  .trim()
  .min(1)
  .max(24)
  .regex(/^[A-Za-z0-9._-]+$/, "invalid code format");

const shortText = z.string().trim().max(120);
const address = z.string().trim().max(50);
const coord = z.string().trim().max(24).regex(/^-?[0-9]*\.?[0-9]*$/).or(z.literal(""));

export const catalogQuery = {
  listas: z.object({}).strict(),
  ciudades: z.object({ cdEstado: code }).strict(),
  sectores: z.object({ cdEstado: code, cdCiudad: code }).strict(),
  propuestas: z.object({}).strict(), // cdProductor / cdConvenio injected server-side
  cliente: z
    .object({
      nacionalidad: z.enum(["V", "E", "J", "G"]),
      cedulaRif: z.string().trim().regex(/^[0-9]{4,12}$/, "invalid id"),
    })
    .strict(),
} as const;

export type CatalogSegment = keyof typeof catalogQuery;

const persona = z
  .object({
    nacionalidad: z.enum(["V", "E", "J", "G", ""]).catch(""),
    cedulaRif: z.number().int().nonnegative(),
    nombres: shortText,
    apellidosRazonSocial: shortText,
    edoCivil: z.string().trim().max(2),
    sexo: z.enum(["M", "F", "X", ""]).catch(""),
    feNacimiento: z
      .string()
      .trim()
      .regex(/^(\d{2}\/\d{2}\/\d{4})?$/, "expected DD/MM/YYYY")
      .max(10),
    pais: shortText,
    estado: shortText,
    ciudad: shortText,
    email: z.string().trim().email().max(120).or(z.literal("")),
    direccion: shortText,
    cdAreaTlf: z.string().trim().max(5).regex(/^[0-9]*$/),
    nuTlf: z.string().trim().max(15).regex(/^[0-9]*$/),
    profesion: shortText,
  })
  .strict();

const hogar = z
  .object({
    deEstado: shortText,
    cdEstado: code,
    deCiudad: shortText,
    cdCiudad: code,
    deSector: shortText,
    cdSector: code,
    cdPostal: z.string().trim().max(10),
    deInmueble: shortText,
    deCalle: shortText,
    x: coord,
    y: coord,
    deDireccion1: address,
    deDireccion2: address,
    cdIndole: code,
  })
  .strict();

export const suscribirBody = z
  .object({
    pedido: z
      .object({
        cdOpcion: z.number().int(),
        cdMoneda: z.string().trim().max(4),
        cdMonedaPago: z.string().trim().max(4).optional(),
        frPago: z.string().trim().max(4),
        hogar,
        asegurado: persona,
        tomador: persona,
        documentos: z
          .array(
            z
              .object({
                cdRamo: z.number().int(),
                cdDocumento: z.number().int(),
                cdRamoDocumento: z.number().int(),
                // https only — the value is forwarded to the SC upstream, which
                // may fetch/render it. Blocks javascript:/data:/file:/SSRF URLs.
                urlDocumento: z
                  .string()
                  .trim()
                  .max(500)
                  .url()
                  .refine((u) => {
                    try {
                      return new URL(u).protocol === "https:";
                    } catch {
                      return false;
                    }
                  }, "must be an https URL"),
              })
              .strict()
          )
          .max(20),
        domicilio: z
          .object({
            tpCuenta: z.string().trim().max(4),
            nuCuenta: z.string().trim().max(30).regex(/^[0-9]*$/),
            feVencimiento: z.string().trim().max(10),
            cdBanco: z.number().int(),
          })
          .strict(),
      })
      .strict(),
  })
  .strict();

export type SuscribirBody = z.infer<typeof suscribirBody>;
