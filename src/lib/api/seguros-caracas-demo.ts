// ─── Seguros Caracas — DEMO client (no network) ─────────────────────────────
// Same surface as `segurosCaracasClient`, but every answer is a local sample
// taken from the examples in Seguros Caracas' own spec («Servicio Web Convenios
// HOGAR», oct-2025). Used only when NEXT_PUBLIC_SC_DEMO=true and the real
// integration is off. It never calls fetch, so nothing reaches Seguros Caracas.

import type {
  ListasInicialesOk,
  CiudadesOk,
  SectoresOk,
  PropuestasOk,
  ClienteOk,
  ApiErrorResponse,
} from "@/types/seguros-caracas";
import type { Result } from "@/lib/api/seguros-caracas";
import {
  checkCiudadesQuery,
  checkSectoresQuery,
  checkClienteQuery,
} from "@/lib/validation/seguros-caracas";

/** Cédula that returns a sample client in demo mode (spec §6 example). */
export const DEMO_CLIENTE_CEDULA = { nacionalidad: "V", cedulaRif: "99999999" } as const;

const LISTAS: ListasInicialesOk = {
  cdError: 0,
  estados: [
    { codigo: "1", descripcion: "DISTRITO CAPITAL" },
    { codigo: "2", descripcion: "AMAZONAS" },
  ],
  indoles: [{ codigo: "1", descripcion: "APARTAMENTO RESIDENCIAL" }],
  paises: [{ codigo: "48", descripcion: "AFGANISTAN" }],
};

const CIUDADES: Record<string, CiudadesOk["ciudades"]> = {
  "1": [{ cdPostal: "1040", codigo: "1", descripcion: "CARACAS", x: "-66.927359", y: "10.451672" }],
  "2": [{ codigo: "-1", descripcion: "SIN CIUDAD", x: "0", y: "0" }],
};

const SECTORES: Record<string, SectoresOk["sectores"]> = {
  "1:1": [{ codigo: "13351", descripcion: "MONTAHUELA", x: "-67.0683", y: "10.3933" }],
};

const PROPUESTAS: PropuestasOk = {
  cdError: 0,
  propuestas: [
    {
      cdConvenio: 20,
      cdMoneda: "02",
      cdOpcion: 1,
      cdRamo: 87,
      deConvenio: "PRUEBA TARJETA",
      frecuencias: [
        { cdFrPago: "A", deFrPago: "Anual", mtPrima: 50.0 },
        { cdFrPago: "T", deFrPago: "Trimestral", mtPrima: 50.0 },
      ],
      mtPrima: 50.0,
      nmPropuesta: "OPCIÓN RESIDENCIAL",
      taCambio: 36.98,
    },
  ],
};

const CLIENTE: ClienteOk = {
  cdError: 0,
  cliente: {
    apellidosRazonSocial: "MORALES GUTIERREZ",
    cedulaRif: 99999999,
    edoCivil: "S",
    feNacimiento: "31/03/2002",
    nacionalidad: "V",
    nombres: "JUAN PEDRO",
    sexo: "M",
  },
};

const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));
const ok = <T>(data: T): Result<T> => ({ ok: true, data });
const notFound = (deError: string): Result<ApiErrorResponse> => ({ ok: true, data: { cdError: -1, deError } });

export const segurosCaracasDemoClient = {
  async getListasIniciales(): Promise<Result<ListasInicialesOk | ApiErrorResponse>> {
    await delay();
    return ok(LISTAS);
  },

  async getCiudades(cdEstado: string): Promise<Result<CiudadesOk | ApiErrorResponse>> {
    const q = checkCiudadesQuery(cdEstado);
    if (!q.ok) return { ok: false, status: 0, error: "invalid_request" };
    await delay();
    return ok({ cdError: 0, ciudades: CIUDADES[cdEstado] ?? [] });
  },

  async getSectores(cdEstado: string, cdCiudad: string): Promise<Result<SectoresOk | ApiErrorResponse>> {
    const q = checkSectoresQuery(cdEstado, cdCiudad);
    if (!q.ok) return { ok: false, status: 0, error: "invalid_request" };
    await delay();
    return ok({ cdError: 0, sectores: SECTORES[`${cdEstado}:${cdCiudad}`] ?? [] });
  },

  async getPropuestas(): Promise<Result<PropuestasOk | ApiErrorResponse>> {
    await delay();
    return ok(PROPUESTAS);
  },

  async getCliente(nacionalidad: string, cedulaRif: string): Promise<Result<ClienteOk | ApiErrorResponse>> {
    const q = checkClienteQuery(nacionalidad, cedulaRif);
    if (!q.ok) return { ok: false, status: 0, error: "invalid_request" };
    await delay();
    const hit =
      nacionalidad.trim().toUpperCase() === DEMO_CLIENTE_CEDULA.nacionalidad &&
      cedulaRif.replace(/\D/g, "") === DEMO_CLIENTE_CEDULA.cedulaRif;
    return hit ? ok(CLIENTE) : notFound("Cliente no encontrado");
  },
};
