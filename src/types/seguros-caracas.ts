// ─── SEGUROS CARACAS — HOGAR WEB SERVICE TYPES ───────────────────────────────

export interface CatalogItem {
  codigo: string;
  descripcion: string;
}

export interface ApiErrorResponse {
  cdError: -1;
  deError: string;
}

// 1. Listas iniciales (GET /consultarListasIniciales)
export interface ListasInicialesOk {
  cdError: 0;
  estados: CatalogItem[];
  indoles: CatalogItem[];
  paises: CatalogItem[];
}

// 2. Ciudades (GET /consultarCiudades?cdEstado=)
export interface Ciudad {
  cdPostal?: string;
  codigo: string;
  descripcion: string;
  x: string;
  y: string;
}

export interface CiudadesOk {
  cdError: 0;
  ciudades: Ciudad[];
}

// 3. Sectores (GET /consultarSectores?cdEstado=&cdCiudad=)
export interface Sector {
  codigo: string;
  descripcion: string;
  x: string;
  y: string;
}

export interface SectoresOk {
  cdError: 0;
  tiempo?: number;
  sectores: Sector[];
}

// 4. Suscripción (POST /suscribir)
export type Sexo = "M" | "F" | "X" | "";
export type Nacionalidad = "V" | "E" | "J" | "G";

export interface SuscribirPedido {
  cdProductor: string;
  cdConvenio: string;
  cdOpcion: number;
  cdMoneda: string;
  cdMonedaPago?: string;
  frPago: string;
  cdUsuario: string;
}

export interface SuscribirHogar {
  deEstado: string;
  cdEstado: string;
  deCiudad: string;
  cdCiudad: string;
  deSector: string;
  cdSector: string;
  cdPostal: string;
  deInmueble: string;
  deCalle: string;
  x: string;
  y: string;
  deDireccion1: string;  // max 50 chars
  deDireccion2: string;  // max 50 chars
  cdIndole: string;
}

export interface SuscribirPersona {
  nacionalidad: string;
  cedulaRif: number;
  nombres: string;
  apellidosRazonSocial: string;
  edoCivil: string;
  sexo: Sexo;
  feNacimiento: string;  // DD/MM/YYYY or ""
  pais: string;
  estado: string;
  ciudad: string;
  email: string;
  direccion: string;
  cdAreaTlf: string;
  nuTlf: string;
  profesion: string;
}

export interface SuscribirDocumento {
  cdRamo: number;
  cdDocumento: number;
  cdRamoDocumento: number;
  urlDocumento: string;
}

export interface SuscribirDomicilio {
  tpCuenta: string;
  nuCuenta: string;
  feVencimiento: string;
  cdBanco: number;
}

// What the browser sends. Broker identifiers (cdProductor / cdConvenio /
// cdUsuario) are injected by the server proxy and MUST NOT be set client-side.
export interface SuscribirRequest {
  pedido: Omit<SuscribirPedido, "cdProductor" | "cdConvenio" | "cdUsuario"> & {
    hogar: SuscribirHogar;
    asegurado: SuscribirPersona;
    tomador: SuscribirPersona;
    documentos: SuscribirDocumento[];
    domicilio: SuscribirDomicilio;
  };
}

export interface SuscribirOk {
  cdError: 0;
  poliza: {
    cdRamo: number;
    cdSucursal: number;
    nuPoliza: number;
    nuRecibo: number;
  };
}

// 5. Propuestas (GET /consultarPropuestas?cdProductor=&cdConvenio=)
export interface FrecuenciaPago {
  cdFrPago: string;
  deFrPago: string;
  mtPrima: number;
}

export interface Propuesta {
  cdConvenio: number;
  cdMoneda: string;
  cdOpcion: number;
  cdRamo: number;
  deConvenio: string;
  frecuencias: FrecuenciaPago[];
  mtPrima: number;
  nmPropuesta: string;
  taCambio: number;
}

export interface PropuestasOk {
  cdError: 0;
  propuestas: Propuesta[];
}

// 6. Consulta de cliente (GET /consultarCliente?nacionalidad=&cedulaRif=)
export interface ClienteOk {
  cdError: 0;
  cliente: {
    apellidosRazonSocial: string;
    cedulaRif: number;
    edoCivil: string;
    feNacimiento: string;
    nacionalidad: string;
    nombres: string;
    sexo: string;
  };
}

// ─── FORM STATE (UI layer) ───────────────────────────────────────────────────
// Every field is a string while the user types. Numeric/typed coercion happens
// once, at submit time, via `toSuscribirPersona`.

export interface PersonaFormState {
  nacionalidad: string;
  cedulaRif: string;
  nombres: string;
  apellidosRazonSocial: string;
  edoCivil: string;
  sexo: string;
  feNacimiento: string;
  pais: string;
  estado: string;
  ciudad: string;
  email: string;
  direccion: string;
  cdAreaTlf: string;
  nuTlf: string;
  profesion: string;
}

export const PERSONA_EMPTY: PersonaFormState = {
  nacionalidad: "",
  cedulaRif: "",
  nombres: "",
  apellidosRazonSocial: "",
  edoCivil: "",
  sexo: "",
  feNacimiento: "",
  pais: "VENEZUELA",
  estado: "",
  ciudad: "",
  email: "",
  direccion: "",
  cdAreaTlf: "",
  nuTlf: "",
  profesion: "",
};

/** Coerce a form persona into the API shape (numbers where SC expects them). */
export function toSuscribirPersona(p: PersonaFormState): SuscribirPersona {
  const digits = p.cedulaRif.replace(/\D/g, "");
  return {
    ...p,
    sexo: (["M", "F", "X"].includes(p.sexo) ? p.sexo : "") as Sexo,
    cedulaRif: digits ? Number(digits) : 0,
  };
}

export interface HogarFormState {
  inmueble: {
    cdEstado: string;
    deEstado: string;
    cdCiudad: string;
    deCiudad: string;
    cdSector: string;
    deSector: string;
    cdPostal: string;
    x: string;
    y: string;
    cdIndole: string;
    deInmueble: string;
    deCalle: string;
    deDireccion1: string;
    deDireccion2: string;
  };
  asegurado: PersonaFormState;
  tomadorIgualAsegurado: boolean;
  tomador: PersonaFormState;
}
