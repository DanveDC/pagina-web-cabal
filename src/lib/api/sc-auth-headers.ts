// Seguros Caracas API credentials (spec «Seguridad API Servicios»): every call
// to a protected service carries two headers, x-api-key and x-secret-id.
// Missing either one → SC answers 401 (application/problem+json).
// Pure module so it can be unit-tested; values come from server env only.

export interface ScApiCredentials {
  apiKey: string;
  secretId: string;
}

/** Headers to add to an upstream request, or null when not configured. */
export function scAuthHeaders(c: ScApiCredentials): Record<string, string> | null {
  const apiKey = c.apiKey.trim();
  const secretId = c.secretId.trim();
  if (!apiKey || !secretId) return null;
  return { "x-api-key": apiKey, "x-secret-id": secretId };
}

/** application/json or any +json type (e.g. application/problem+json). */
export function isJsonContentType(ct: string): boolean {
  const base = ct.split(";")[0]!.trim().toLowerCase();
  return base === "application/json" || base.endsWith("+json");
}
