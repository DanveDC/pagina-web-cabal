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
