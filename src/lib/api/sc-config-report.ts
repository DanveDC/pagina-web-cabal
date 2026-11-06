// Names (never values) of the Seguros Caracas settings that are missing or
// unrecognised, so Runtime Logs say exactly what to fix. DigitalOcean replaces
// 5xx bodies with its own page, so the JSON error code is not visible outside.

export interface ScConfigInput {
  proxyEnabledRaw: string | undefined;
  baseUrl: string;
  productor: string;
  convenio: string;
  apiKey: string;
  secretId: string;
  proxyToken: string;
}

export function scConfigProblems(c: ScConfigInput): string[] {
  const out: string[] = [];
  const raw = (c.proxyEnabledRaw ?? "").trim();
  if (!["1", "true", "yes", "on"].includes(raw.toLowerCase())) {
    out.push(raw ? `SC_PROXY_ENABLED (valor no reconocido; use true sin comillas)` : "SC_PROXY_ENABLED (vacía)");
  }
  if (!c.baseUrl) out.push("SC_BASE_URL (vacía)");
  else if (!/^https:\/\/[^/\s"']+$/.test(c.baseUrl)) out.push("SC_BASE_URL (formato inválido; ej. https://sasweb-test.seguroscaracas.com, sin comillas ni ruta)");
  if (!c.productor.trim()) out.push("SC_PRODUCTOR (vacía)");
  if (!c.convenio.trim()) out.push("SC_CONVENIO (vacía)");
  if (!c.apiKey.trim()) out.push("SC_API_KEY (vacía)");
  if (!c.secretId.trim()) out.push("SC_SECRET_ID (vacía)");
  if (!c.proxyToken.trim()) out.push("SC_PROXY_TOKEN (vacía)");
  return out;
}

let lastLogged = "";
/** Logs the problem list at most once per distinct state. */
export function logScConfigProblems(problems: string[], where: string): void {
  const key = problems.join("|");
  if (!problems.length || key === lastLogged) return;
  lastLogged = key;
  console.error(`[sc-config] ${where}: integración no operativa. Revisar en DigitalOcean: ${problems.join("; ")}`);
}
