// ─── MCP Gateway — Claude Desktop agent access ──────────────────────────────
// Server-to-server endpoint: no Origin check required (MCP runs locally).
// All calls to Seguros Caracas are made server-side; credentials never leave
// this server. Requires Bearer MCP_TOKEN in Authorization header.

import { NextRequest, NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";
import { segurosCaracas } from "@/lib/security/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─── auth ───────────────────────────────────────────────────────────────────

function tokenOk(header: string | null): boolean {
  const expected = process.env.MCP_TOKEN;
  if (!expected) return false;
  const got = header?.replace(/^Bearer\s+/i, "").trim() ?? "";
  // Hash both sides to fixed length — no timing leak on length mismatch.
  const a = createHash("sha256").update(got).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

// ─── upstream helper ─────────────────────────────────────────────────────────

const SC_PATHS = {
  listas:    "/hogarswservicios/hogarsw/consultarListasIniciales",
  ciudades:  "/hogarswservicios/hogarsw/consultarCiudades",
  sectores:  "/hogarswservicios/hogarsw/consultarSectores",
  propuestas:"/hogarswservicios/hogarsw/consultarPropuestas",
  suscribir: "/hogarswservicios/hogarsw/suscribir",
  cliente:   "/suscripcionexternaswservicios/suscripcionexternasw/consultarCliente",
} as const;

async function callSC(
  path: string,
  init: RequestInit & { rawBody?: string }
): Promise<{ data: unknown; status: number }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), segurosCaracas.timeoutMs);
  const url = `${segurosCaracas.baseUrl}${path}`;

  try {
    const upstream = await fetch(url, {
      method: init.method,
      headers: init.headers,
      body: init.rawBody,
      signal: controller.signal,
      redirect: "error",
    });

    let data: unknown;
    try { data = await upstream.json(); }
    catch { return { data: { error: "upstream_bad_response" }, status: 502 }; }

    return { data, status: upstream.ok ? 200 : 502 };
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    return { data: { error: aborted ? "upstream_timeout" : "upstream_unreachable" }, status: 502 };
  } finally {
    clearTimeout(timer);
  }
}

// ─── actions ─────────────────────────────────────────────────────────────────

type Params = Record<string, unknown>;

async function handleAction(action: string, params: Params): Promise<NextResponse> {
  if (!segurosCaracas.enabled || !segurosCaracas.baseUrl) {
    return NextResponse.json({ error: "service_disabled" }, { status: 503 });
  }

  switch (action) {
    // ── catalog (read) ──────────────────────────────────────────────────────

    case "listas": {
      const { data, status } = await callSC(SC_PATHS.listas, { method: "GET" });
      return NextResponse.json(data, { status });
    }

    case "ciudades": {
      const cdEstado = String(params.cdEstado ?? "");
      if (!cdEstado) return NextResponse.json({ error: "cdEstado requerido" }, { status: 400 });
      const sp = new URLSearchParams({ cdEstado });
      const { data, status } = await callSC(`${SC_PATHS.ciudades}?${sp}`, { method: "GET" });
      return NextResponse.json(data, { status });
    }

    case "sectores": {
      const cdEstado = String(params.cdEstado ?? "");
      const cdCiudad = String(params.cdCiudad ?? "");
      if (!cdEstado || !cdCiudad)
        return NextResponse.json({ error: "cdEstado y cdCiudad requeridos" }, { status: 400 });
      const sp = new URLSearchParams({ cdEstado, cdCiudad });
      const { data, status } = await callSC(`${SC_PATHS.sectores}?${sp}`, { method: "GET" });
      return NextResponse.json(data, { status });
    }

    case "propuestas": {
      const { productor, convenio } = segurosCaracas;
      if (!productor || !convenio)
        return NextResponse.json({ error: "credentials_not_configured" }, { status: 503 });
      const sp = new URLSearchParams({ cdProductor: productor, cdConvenio: convenio });
      const { data, status } = await callSC(`${SC_PATHS.propuestas}?${sp}`, { method: "GET" });
      return NextResponse.json(data, { status });
    }

    // ── client lookup (PII — Bearer-gated at this layer too) ────────────────

    case "consultar_cliente": {
      const { productor } = segurosCaracas;
      if (!productor)
        return NextResponse.json({ error: "credentials_not_configured" }, { status: 503 });
      const nacionalidad = String(params.nacionalidad ?? "V");
      const cedulaRif    = String(params.cedulaRif ?? "");
      if (!cedulaRif)
        return NextResponse.json({ error: "cedulaRif requerido" }, { status: 400 });
      const sp = new URLSearchParams({ cdProductor: productor, nacionalidad, cedulaRif });
      const { data, status } = await callSC(`${SC_PATHS.cliente}?${sp}`, { method: "GET" });
      return NextResponse.json(data, { status });
    }

    // ── policy emission ─────────────────────────────────────────────────────

    case "suscribir": {
      const { productor, convenio } = segurosCaracas;
      if (!productor || !convenio)
        return NextResponse.json({ error: "credentials_not_configured" }, { status: 503 });

      const pedidoIn = (params.pedido ?? {}) as Record<string, unknown>;
      // Server injects broker credentials; client cannot override them.
      const payload = {
        pedido: {
          ...pedidoIn,
          cdProductor: productor,
          cdConvenio:  convenio,
          cdUsuario:   productor,
        },
      };

      const { data, status } = await callSC(SC_PATHS.suscribir, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        rawBody: JSON.stringify(payload),
      });
      return NextResponse.json(data, { status });
    }

    // ── Pólizas ──────────────────────────────────────────────────────────────
    case "buscar_polizas":
    case "get_poliza":
    case "polizas_por_vencer":
    case "estadisticas_cartera":

    // ── Clientes internos ─────────────────────────────────────────────────
    case "buscar_cliente":
    case "historial_cliente":

    // ── Siniestros ────────────────────────────────────────────────────────
    case "registrar_siniestro":
    case "buscar_siniestros":
    case "get_siniestro":
    case "actualizar_siniestro":

    // ── Renovaciones ──────────────────────────────────────────────────────
    case "renovaciones_pendientes":
    case "registrar_renovacion":
    case "historial_renovaciones":

    // ── Comisiones ────────────────────────────────────────────────────────
    case "comisiones_pendientes":
    case "resumen_comisiones_agente":
    case "resumen_comisiones_periodo":
    case "registrar_pago_comision":

    // ── Reportes ──────────────────────────────────────────────────────────
    case "reporte_produccion":
    case "ranking_agentes":
      return NextResponse.json(
        {
          error: "not_implemented",
          detail:
            "Esta función requiere la base de datos PostgreSQL configurada. " +
            "Provisiona la BD en DigitalOcean ($15/mes) y agrega DATABASE_URL al entorno. " +
            "Ver DATABASE.md para el esquema de tablas.",
        },
        { status: 501 }
      );

    default:
      return NextResponse.json({ error: "unknown_action" }, { status: 400 });
  }
}

// ─── route handler ───────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!tokenOk(req.headers.get("authorization"))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { action?: unknown; params?: unknown };
  try {
    const text = await req.text();
    if (text.length > 50_000) return NextResponse.json({ error: "payload_too_large" }, { status: 413 });
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const action = typeof body.action === "string" ? body.action : "";
  const params = body.params && typeof body.params === "object" && !Array.isArray(body.params)
    ? (body.params as Params)
    : {};

  return handleAction(action, params);
}

// Other methods not allowed
export function GET()    { return NextResponse.json({ error: "method_not_allowed" }, { status: 405 }); }
export function PUT()    { return NextResponse.json({ error: "method_not_allowed" }, { status: 405 }); }
export function DELETE() { return NextResponse.json({ error: "method_not_allowed" }, { status: 405 }); }
