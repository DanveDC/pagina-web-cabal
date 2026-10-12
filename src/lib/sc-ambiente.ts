// Client-safe flags for the Seguros Caracas integration. Do NOT import the
// server-only security env module here: NEXT_PUBLIC_* values are inlined at
// build time only when accessed with a literal `process.env.NAME`.

export type ScAmbiente = "pruebas" | "produccion";

/** Anything other than "produccion" (trimmed, case-insensitive) is "pruebas". */
export function parseScAmbiente(raw: string | null | undefined): ScAmbiente {
  return typeof raw === "string" && raw.trim().toLowerCase() === "produccion"
    ? "produccion"
    : "pruebas";
}

export const SC_AMBIENTE: ScAmbiente = parseScAmbiente(
  process.env.NEXT_PUBLIC_SC_AMBIENTE
);

export const SC_ENABLED: boolean = process.env.NEXT_PUBLIC_SC_ENABLED === "true";

export const SC_AMBIENTE_BANNER_TEXT =
  "AMBIENTE DE PRUEBAS · Seguros Caracas (sasweb-test). Las pólizas emitidas aquí no tienen validez comercial.";
