// Pure, client-safe helpers to classify the SC "suscribir" (emission) response.
// Shared by the /api/emitir/hogar route and the Emitir UI so both agree on
// what counts as a successful emission.

export type Poliza = {
  cdRamo: number;
  cdSucursal: number;
  nuPoliza: number;
  nuRecibo: number;
};

export type EmitirAmbiente = "pruebas" | "produccion";

export type EmitirResult =
  | { ok: true; poliza: Poliza }
  | {
      ok: false;
      status: number;
      code: string;
      message: string;
      deError?: string;
    };

const GENERIC_MESSAGE =
  "No se pudo completar la operación con Seguros Caracas. Por favor intente nuevamente en unos minutos.";

const MESSAGES: Record<string, string> = {
  service_disabled:
    "El servicio de emisión no está disponible por el momento. Por favor intente más tarde.",
  rate_limited:
    "Ha realizado demasiadas solicitudes en poco tiempo. Por favor espere un momento e intente nuevamente.",
  forbidden_origin:
    "No se pudo validar el origen de la solicitud. Recargue la página e intente nuevamente.",
  unauthorized:
    "No fue posible autorizar la solicitud ante el servicio de emisión. Por favor contacte a soporte.",
  credentials_not_configured:
    "El servicio de Seguros Caracas aún no está configurado para esta operación. Por favor intente más tarde.",
  upstream_unreachable:
    "No fue posible comunicarse con Seguros Caracas. Por favor intente nuevamente en unos minutos.",
  upstream_timeout:
    "Seguros Caracas tardó demasiado en responder. Por favor intente nuevamente.",
  upstream_bad_response:
    "Seguros Caracas devolvió una respuesta inesperada. Por favor intente nuevamente.",
  upstream_response_too_large:
    "Seguros Caracas devolvió una respuesta demasiado grande para procesar.",
  invalid_parameters:
    "Algunos datos ingresados no son válidos. Revise la información e intente nuevamente.",
  invalid_json:
    "La solicitud no pudo ser interpretada. Recargue la página e intente nuevamente.",
  payload_too_large:
    "La solicitud excede el tamaño permitido. Revise los datos ingresados.",
  unsupported_media_type:
    "La solicitud tiene un formato no admitido. Recargue la página e intente nuevamente.",
  invalid_request:
    "La solicitud no es válida. Revise los datos ingresados e intente nuevamente.",
  network_error:
    "No hay conexión con el servidor. Verifique su conexión a internet e intente nuevamente.",
  aborted: "La solicitud fue cancelada. Por favor intente nuevamente.",
  invalid_response:
    "No se pudo confirmar la emisión de la póliza. No repita la operación sin verificar primero con Seguros Caracas.",
  sc_rejected:
    "Seguros Caracas rechazó la operación. Revise los datos e intente nuevamente.",
};

export function describeScError(code: string): string {
  if (typeof code === "string" && Object.prototype.hasOwnProperty.call(MESSAGES, code)) {
    return MESSAGES[code];
  }
  return GENERIC_MESSAGE;
}

/** Strips markup and control chars, collapses whitespace and caps the length. */
export function sanitizeDeError(raw: unknown, max = 300): string {
  if (typeof raw !== "string") return "";
  const cleaned = raw
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
    .replace(/[<>]/g, "")
    .trim();
  if (cleaned.length <= max) return cleaned;
  return cleaned.slice(0, max).trimEnd() + "…";
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isNum(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function fail(
  status: number,
  code: string,
  message?: string,
  deError?: string
): EmitirResult {
  return {
    ok: false,
    status,
    code,
    message: message ?? describeScError(code),
    ...(deError ? { deError } : {}),
  };
}

export function classifyEmitirResult(status: number, body: unknown): EmitirResult {
  if (!isObject(body)) return fail(502, "upstream_bad_response");

  if (typeof body.error === "string" && body.error) {
    if (body.error === "sc_rejected") {
      // Idempotent re-classification of the route's own 422 body.
      const deError = sanitizeDeError(body.deError);
      return fail(422, "sc_rejected", deError || describeScError("sc_rejected"), deError);
    }
    return fail(status >= 400 ? status : 502, body.error);
  }

  const cdError = body.cdError;
  if (isNum(cdError) && cdError !== 0) {
    const deError = sanitizeDeError(body.deError);
    return fail(422, "sc_rejected", deError || describeScError("sc_rejected"), deError);
  }

  if (cdError === 0 && status >= 200 && status < 300) {
    const p = body.poliza;
    if (
      isObject(p) &&
      isNum(p.cdRamo) &&
      isNum(p.cdSucursal) &&
      isNum(p.nuPoliza) &&
      isNum(p.nuRecibo)
    ) {
      return {
        ok: true,
        poliza: {
          cdRamo: p.cdRamo,
          cdSucursal: p.cdSucursal,
          nuPoliza: p.nuPoliza,
          nuRecibo: p.nuRecibo,
        },
      };
    }
  }

  if (status >= 400) return fail(status, "upstream_bad_response");
  return fail(502, "invalid_response");
}

/** Formats a date as "dd/mm/yyyy" and "HH:mm:ss" in America/Caracas. */
export function formatCaracasDateTime(d: Date): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat("es-VE", {
    timeZone: "America/Caracas",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return {
    date: `${get("day")}/${get("month")}/${get("year")}`,
    time: `${get("hour")}:${get("minute")}:${get("second")}`,
  };
}

export function formatPolizaText(
  p: Poliza,
  emittedAt: Date,
  ambiente: EmitirAmbiente
): string {
  const { date, time } = formatCaracasDateTime(emittedAt);
  const lines = [
    "Datos de la póliza HOGAR — Seguros Caracas",
    `Ramo: ${p.cdRamo}`,
    `Sucursal: ${p.cdSucursal}`,
    `Número de póliza: ${p.nuPoliza}`,
    `Número de recibo: ${p.nuRecibo}`,
    `Fecha de registro: ${date}`,
    `Hora de registro: ${time} (hora de Caracas)`,
  ];
  if (ambiente === "pruebas") lines.push("Ambiente: PRUEBAS (sin validez comercial)");
  return lines.join("\n");
}
