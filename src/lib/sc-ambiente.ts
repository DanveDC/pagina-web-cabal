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

/**
 * Demo mode: the emission form runs on local sample data from Seguros Caracas'
 * own spec and shows the JSON that would be sent, without calling any API.
 * The real integration always takes precedence.
 */
export const SC_DEMO: boolean = !SC_ENABLED && process.env.NEXT_PUBLIC_SC_DEMO === "true";

export const SC_DEMO_BANNER_TEXT =
  "MODO DEMOSTRACIÓN · Datos de ejemplo tomados de la especificación de Seguros Caracas. No se envía información a Seguros Caracas ni se emiten pólizas.";

/** Cloudflare Turnstile public site key. Empty = anti-bot widget disabled. */
export const TURNSTILE_SITE_KEY: string = (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "").trim();
