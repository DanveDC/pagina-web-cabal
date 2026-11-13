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

/** "USD 50,00" — amount formatted for es-VE with two decimals; "—" if missing. */
export function formatPrima(cdMoneda: string, monto: number | undefined | null): string {
  if (typeof monto !== "number" || !Number.isFinite(monto)) return "—";
  const amount = monto.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const label = monedaLabel(cdMoneda);
  return label ? `${label} ${amount}` : amount;
}

/**
 * Premium of one payment frequency in the plan's currency.
 * sasweb-test returns mtPrimaBs + mtPrimaUsd; the spec example shows mtPrima.
 */
export function primaFrecuencia(
  f: { mtPrima?: number; mtPrimaBs?: number; mtPrimaUsd?: number },
  cdMoneda: string
): number | undefined {
  const pick = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : undefined);
  const code = String(cdMoneda ?? "").trim();
  if (code === "01") return pick(f.mtPrimaBs) ?? pick(f.mtPrima);
  if (code === "02") return pick(f.mtPrimaUsd) ?? pick(f.mtPrima);
  return pick(f.mtPrima) ?? pick(f.mtPrimaUsd) ?? pick(f.mtPrimaBs);
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
