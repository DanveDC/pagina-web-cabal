/**
 * API Client — Cabal Asesores
 *
 * Dos capas de conectividad:
 *  1. APIs externas de aseguradoras (HTTPS público)
 *  2. Servidor local de la oficina (LAN / VPN — propenso a latencia)
 */

import { withRetry } from "@/lib/utils";
import type { ConectividadServidor, ResultadoCotizacion } from "@/types/cotizacion";

// ─── CONFIG ──────────────────────────────────────────────────────────────────

const LOCAL_SERVER_URL = process.env.NEXT_PUBLIC_LOCAL_SERVER_URL ?? "http://192.168.1.100:3001";
const API_TIMEOUT_MS   = 15_000;
const LOCAL_TIMEOUT_MS = 8_000;

// ─── BASE FETCH CON TIMEOUT ──────────────────────────────────────────────────

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = API_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    if (!res.ok) throw new ApiError(res.status, await res.text());
    return res;
  } finally {
    clearTimeout(timer);
  }
}

// ─── ERROR TIPADO ─────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly isLocalServer = false
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ─── CLIENTE SERVIDOR LOCAL ───────────────────────────────────────────────────

export const localClient = {
  async ping(): Promise<ConectividadServidor> {
    const start = Date.now();
    try {
      await fetchWithTimeout(`${LOCAL_SERVER_URL}/health`, {}, LOCAL_TIMEOUT_MS);
      const latenciaMs = Date.now() - start;
      return {
        estado: latenciaMs > 3000 ? "latencia_alta" : "conectado",
        latenciaMs,
        ultimaSync: new Date(),
      };
    } catch {
      return { estado: "desconectado" };
    }
  },

  async guardarCotizacion(data: ResultadoCotizacion): Promise<void> {
    await withRetry(() =>
      fetchWithTimeout(
        `${LOCAL_SERVER_URL}/api/cotizaciones`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
        LOCAL_TIMEOUT_MS
      )
    );
  },

  async getCotizaciones(): Promise<ResultadoCotizacion[]> {
    const res = await withRetry(() =>
      fetchWithTimeout(`${LOCAL_SERVER_URL}/api/cotizaciones`, {}, LOCAL_TIMEOUT_MS)
    );
    return res.json();
  },
};

// ─── CLIENTE APIS EXTERNAS (ASEGURADORAS) ─────────────────────────────────────

export const aseguradorasClient = {
  /**
   * Proxy a través de nuestra propia API Route de Next.js
   * para ocultar API keys y agregar caché.
   */
  async cotizar(payload: unknown): Promise<unknown> {
    const res = await fetchWithTimeout("/api/cotizar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.json();
  },
};
