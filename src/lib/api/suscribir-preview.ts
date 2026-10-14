// Builds the exact body the server proxy would send to Seguros Caracas'
// `suscribir` for a validated client payload. Mirrors the injection done in
// src/app/api/seguros-caracas/[...path]/route.ts: broker credentials are added
// server-side, so here they are shown as explicit placeholders.

import type { SuscribirRequest } from "@/types/seguros-caracas";

export const PENDING_SC = "<pendiente — asignado por Seguros Caracas>";

export function buildUpstreamPreview(payload: SuscribirRequest) {
  const { pedido } = payload;
  return {
    pedido: {
      cdProductor: PENDING_SC,
      cdConvenio: PENDING_SC,
      cdOpcion: pedido.cdOpcion,
      cdMoneda: pedido.cdMoneda,
      ...(pedido.cdMonedaPago ? { cdMonedaPago: pedido.cdMonedaPago } : {}),
      frPago: pedido.frPago,
      cdUsuario: PENDING_SC,
      hogar: pedido.hogar,
      asegurado: pedido.asegurado,
      tomador: pedido.tomador,
      documentos: pedido.documentos,
      domicilio: pedido.domicilio,
    },
  };
}
