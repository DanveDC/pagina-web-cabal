// Display labels for Seguros Caracas currency codes (cdMoneda).
// Confirmed by Seguros Caracas (22/10/2026): 01 = bolívares, 02 = dólares.
// Only the label shown on screen changes; the code sent to SC is untouched.

const MONEDAS: Record<string, string> = {
  "01": "Bs.",
  "02": "USD",
};

/** Human label for a cdMoneda code; unknown codes are shown as "Moneda <code>". */
export function monedaLabel(cdMoneda: string): string {
  const code = String(cdMoneda ?? "").trim();
  return MONEDAS[code] ?? (code ? `Moneda ${code}` : "");
}

/** "USD 50,00" — amount formatted for es-VE with two decimals. */
export function formatPrima(cdMoneda: string, monto: number): string {
  const amount = monto.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const label = monedaLabel(cdMoneda);
  return label ? `${label} ${amount}` : amount;
}

// Payment frequencies confirmed by Seguros Caracas (22/10/2026).
export const FRECUENCIAS: Record<string, string> = {
  A: "Anual",
  S: "Semestral",
  C: "Cuatrimestral",
  T: "Trimestral",
};
export const CODIGOS_MONEDA = Object.keys(MONEDAS);
export const CODIGOS_FRECUENCIA = Object.keys(FRECUENCIAS);

/** Label for a frPago / cdFrPago code; falls back to SC's own description. */
export function frecuenciaLabel(cdFrPago: string, deFrPago?: string): string {
  const code = String(cdFrPago ?? "").trim().toUpperCase();
  return FRECUENCIAS[code] ?? (deFrPago?.trim() || (code ? `Frecuencia ${code}` : ""));
}
