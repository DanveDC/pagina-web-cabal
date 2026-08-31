// ─── Seguros Caracas — HOGAR API client (browser) ──────────────────────────
// Talks only to our own /api/seguros-caracas/* proxy. Broker credentials live
// on the server; this module never sees or sends them.

import type {
  ListasInicialesOk,
  CiudadesOk,
  SectoresOk,
  PropuestasOk,
  ClienteOk,
  SuscribirRequest,
  SuscribirOk,
  ApiErrorResponse,
} from "@/types/seguros-caracas";
import {
  checkCiudadesQuery,
  checkSectoresQuery,
  checkClienteQuery,
} from "@/lib/validation/seguros-caracas";
import { suscribirBody } from "@/lib/api/seguros-caracas.schema";

const BASE = "/api/seguros-caracas";
const CLIENT_TIMEOUT_MS = 15_000;

type Ok<T> = { ok: true; data: T };
type Err = { ok: false; error: string; status: number };
export type Result<T> = Ok<T> | Err;

function errResult(status: number, error: string): Err {
  return { ok: false, status, error };
}

async function request<T>(
  path: string,
  init: RequestInit & { signal?: AbortSignal }
): Promise<Result<T>> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), CLIENT_TIMEOUT_MS);
  // Chain an externally-provided signal (e.g. React effect cleanup).
  if (init.signal) {
    if (init.signal.aborted) ctrl.abort();
    else init.signal.addEventListener("abort", () => ctrl.abort(), { once: true });
  }

  try {
    const res = await fetch(`${BASE}${path}`, {
      ...init,
      signal: ctrl.signal,
      headers: { Accept: "application/json", ...init.headers },
      credentials: "same-origin",
    });

    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      /* non-JSON error page */
    }

    if (!res.ok) {
      const code =
        body && typeof body === "object" && "error" in body
          ? String((body as { error: unknown }).error)
          : `http_${res.status}`;
      return errResult(res.status, code);
    }

    return { ok: true, data: body as T };
  } catch (err) {
    const aborted = err instanceof DOMException && err.name === "AbortError";
    return errResult(0, aborted ? "aborted" : "network_error");
  } finally {
    clearTimeout(timer);
  }
}

function toQuery(params?: Record<string, string>): string {
  if (!params) return "";
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== "") sp.set(k, v);
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export const segurosCaracasClient = {
  getListasIniciales(signal?: AbortSignal) {
    return request<ListasInicialesOk | ApiErrorResponse>("/listas", { method: "GET", signal });
  },

  // Params are sanitised + schema-checked here; a known-bad request is never
  // sent to the network (the server proxy validates again regardless).
  getCiudades(cdEstado: string, signal?: AbortSignal) {
    const q = checkCiudadesQuery(cdEstado);
    if (!q.ok) return Promise.resolve(errResult(0, "invalid_request"));
    return request<CiudadesOk | ApiErrorResponse>(`/ciudades${toQuery(q.params)}`, {
      method: "GET",
      signal,
    });
  },

  getSectores(cdEstado: string, cdCiudad: string, signal?: AbortSignal) {
    const q = checkSectoresQuery(cdEstado, cdCiudad);
    if (!q.ok) return Promise.resolve(errResult(0, "invalid_request"));
    return request<SectoresOk | ApiErrorResponse>(`/sectores${toQuery(q.params)}`, {
      method: "GET",
      signal,
    });
  },

  // Broker credentials (cdProductor / cdConvenio) are injected by the proxy.
  getPropuestas(signal?: AbortSignal) {
    return request<PropuestasOk | ApiErrorResponse>("/propuestas", { method: "GET", signal });
  },

  getCliente(nacionalidad: string, cedulaRif: string, signal?: AbortSignal) {
    const q = checkClienteQuery(nacionalidad, cedulaRif);
    if (!q.ok) return Promise.resolve(errResult(0, "invalid_request"));
    return request<ClienteOk | ApiErrorResponse>(`/cliente${toQuery(q.params)}`, {
      method: "GET",
      signal,
    });
  },

  suscribir(payload: SuscribirRequest, signal?: AbortSignal) {
    // Final client-side gate: the payload must satisfy the wire schema.
    if (!suscribirBody.safeParse(payload).success) {
      return Promise.resolve(errResult(0, "invalid_request"));
    }
    return request<SuscribirOk | ApiErrorResponse>("/suscribir", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal,
    });
  },
};
