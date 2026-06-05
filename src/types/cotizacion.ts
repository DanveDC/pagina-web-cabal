// ─── TIPOS CORE DEL MÓDULO DE COTIZACIONES ───────────────────────────────────

export type RamoSeguro =
  | "automovil"
  | "salud"
  | "hogar"
  | "patrimoniales"
  | "responsabilidad_civil"
  | "transporte";

export type EstadoCotizacion =
  | "idle"
  | "loading"
  | "calculating"
  | "ready"
  | "error"
  | "server_unavailable";

// ─── EMPRESA (entidad B2B) ────────────────────────────────────────────────────

export interface EmpresaFormData {
  razonSocial: string;
  rif: string;                    // J-XXXXXXXX-X
  actividadEconomica: string;
  sectorIndustrial: string;
  empleados: number;
  facturacionAnual: number;       // USD
  direccionFiscal: string;
  personaContacto: string;
  emailContacto: string;
  telefonoContacto: string;
}

// ─── COTIZACIÓN POR RAMO ─────────────────────────────────────────────────────

export interface CotizacionAutomovil {
  marca: string;
  modelo: string;
  ano: number;
  placas: string;
  valorAsegurado: number;
  uso: "particular" | "comercial" | "carga";
  flota: boolean;
  cantidadVehiculos?: number;
}

export interface CotizacionSalud {
  cantidadAsegurados: number;
  edadPromedio: number;
  coberturaDeseada: "basica" | "intermedia" | "premium";
  incluirFamiliares: boolean;
  preexistencias: boolean;
}

export interface CotizacionPatrimonial {
  tipoRiesgo: string;
  valorBienes: number;
  ubicacion: string;
  metrosCuadrados: number;
  materialConstruccion: string;
  sistemaContraIncendios: boolean;
}

export type CotizacionDetalle =
  | CotizacionAutomovil
  | CotizacionSalud
  | CotizacionPatrimonial;

// ─── RESPUESTA DE ASEGURADORA ─────────────────────────────────────────────────

export interface OfertaAseguradora {
  id: string;
  aseguradora: string;
  logoUrl?: string;
  primaAnual: number;
  primaMensual: number;
  moneda: "USD" | "VES";
  coberturas: string[];
  exclusiones: string[];
  deducible: number;
  sumAsegurada: number;
  vigencia: string;
  tiempoRespuesta: number;         // ms — para mostrar badge de velocidad
  recommended?: boolean;
}

export interface ResultadoCotizacion {
  id: string;
  ramo: RamoSeguro;
  empresa: EmpresaFormData;
  detalle: CotizacionDetalle;
  ofertas: OfertaAseguradora[];
  generadoEn: Date;
  expiraEn: Date;
}

// ─── ESTADO DE CONECTIVIDAD ───────────────────────────────────────────────────

export interface ConectividadServidor {
  estado: "conectado" | "latencia_alta" | "desconectado";
  latenciaMs?: number;
  ultimaSync?: Date;
}
