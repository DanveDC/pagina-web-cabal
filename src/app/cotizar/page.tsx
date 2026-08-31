"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { segurosCaracasClient } from "@/lib/api/seguros-caracas";
import { PERSONA_EMPTY } from "@/types/seguros-caracas";
import type { HogarFormState, PersonaFormState, Propuesta, Ciudad, Sector } from "@/types/seguros-caracas";
import {
  sanitizePersonaField, sanitizeInmuebleField,
  validatePersona, validateInmueble, hasErrors,
  type FieldErrors,
} from "@/lib/validation/seguros-caracas";

// ─── CREDENTIALS ─────────────────────────────────────────────────────────────
// Broker credentials live ONLY on the server (SC_PRODUCTOR / SC_CONVENIO env
// vars, injected by the /api/seguros-caracas proxy). The browser only learns
// whether the integration is live via this public, non-secret flag.
const CREDENTIALS_READY = process.env.NEXT_PUBLIC_SC_ENABLED === "true";

// ─── TYPES ────────────────────────────────────────────────────────────────────
type Ramo = "automovil" | "salud" | "hogar" | "patrimoniales";
type Step = 1 | 2 | 3 | "results";

interface EmpresaForm {
  razonSocial: string; rif: string; empleados: string;
  sector: string; facturacion: string; email: string; telefono: string;
}
interface AutoForm {
  marca: string; modelo: string; anio: string;
  valor: string; uso: string; nVehiculos: string;
}
interface SaludForm { nAsegurados: string; edadPromedio: string; cobertura: string; }
interface PatrimonialForm { tipoRiesgo: string; valorBienes: string; direccion: string; metros: string; }
interface OfertaDisplay {
  nombre: string; siglas: string; color: string;
  prima_anual: number; prima_mensual: number;
  tag: string; score: number;
  coberturas: { label: string; valor: string }[];
  destacado: boolean;
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const RAMOS: { id: Ramo; label: string; desc: string; color: string; icon: string }[] = [
  { id: "automovil",     label: "Automóvil",    desc: "Flota vehicular e individuales",  color: "#5B3AF5", icon: "🚗" },
  { id: "salud",         label: "Salud",         desc: "HCM colectivo para tu equipo",    color: "#059669", icon: "❤️" },
  { id: "hogar",         label: "Hogar",         desc: "Residenciales y comerciales",     color: "#D97706", icon: "🏠" },
  { id: "patrimoniales", label: "Patrimoniales", desc: "Bienes y responsabilidad civil",  color: "#0284C7", icon: "🏢" },
];

const STEPS = ["Empresa", "Ramo", "Detalles"];

const OFERTAS_PLACEHOLDER: OfertaDisplay[] = [
  {
    nombre: "Seguros Caracas", siglas: "SC", color: "#3A1335",
    prima_anual: 0, prima_mensual: 0, tag: "Pendiente", score: 94,
    coberturas: [
      { label: "Suma asegurada",          valor: "— pendiente de credenciales —" },
      { label: "Deducible",               valor: "— pendiente de credenciales —" },
      { label: "Red clínica",             valor: "— pendiente de credenciales —" },
      { label: "Cobertura internacional", valor: "Incluida" },
    ],
    destacado: true,
  },
];

const HOGAR_INIT: HogarFormState = {
  inmueble: {
    cdEstado: "", deEstado: "", cdCiudad: "", deCiudad: "",
    cdSector: "", deSector: "", cdPostal: "", x: "", y: "",
    cdIndole: "", deInmueble: "", deCalle: "", deDireccion1: "", deDireccion2: "",
  },
  asegurado: { ...PERSONA_EMPTY },
  tomadorIgualAsegurado: true,
  tomador: { ...PERSONA_EMPTY },
};

// ─── ANIMATION PRESETS ────────────────────────────────────────────────────────
const fadeSlide = {
  initial: { opacity: 0, x: 16 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -16 },
  transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] as number[] },
};
const fadeUp = {
  initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10 },
  transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as number[] },
};

// ─── SMALL COMPONENTS ─────────────────────────────────────────────────────────
function StepDot({ n, active, done }: { n: number; active: boolean; done: boolean }) {
  const bg     = done ? "#3A1335" : active ? "rgba(58,19,53,0.10)" : "rgba(58,19,53,0.07)";
  const border = active || done ? "#3A1335" : "rgba(58,19,53,0.15)";
  const color  = done ? "#fff" : active ? "#3A1335" : "#7A7A8A";
  return (
    <div style={{
      width: 26, height: 26, borderRadius: "50%",
      backgroundColor: bg, border: `1.5px solid ${border}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 11, fontWeight: 700, color,
      transition: "background-color 200ms ease, border-color 200ms ease, color 200ms ease",
      flexShrink: 0,
    }}>
      {done ? "✓" : n}
    </div>
  );
}

const ERR_COLOR = "#B91C1C";

function Field({
  label, type = "text", placeholder = "", hint = "", suffix = "", value = "", onChange,
  error = "", inputMode, maxLength,
}: {
  label: string; type?: string; placeholder?: string; hint?: string;
  suffix?: string; value?: string; onChange?: (v: string) => void;
  error?: string; inputMode?: "text" | "numeric" | "email" | "tel"; maxLength?: number;
}) {
  const base = error ? ERR_COLOR : "#d2c2cb";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{
        fontSize: 11, fontWeight: 600, color: "#3A1335",
        letterSpacing: "0.10em", textTransform: "uppercase" as const,
      }}>{label}</label>
      <div style={{ position: "relative" }}>
        <input
          type={type}
          inputMode={inputMode}
          maxLength={maxLength}
          placeholder={placeholder || label}
          value={value}
          onChange={e => onChange?.(e.target.value)}
          aria-invalid={error ? true : undefined}
          style={{
            width: "100%", padding: suffix ? "10px 40px 10px 0" : "10px 0",
            background: "transparent", border: "none",
            borderBottom: `1.5px solid ${base}`,
            color: "#1f1a1d", fontSize: 14, outline: "none",
            transition: "border-color 200ms ease", boxSizing: "border-box" as const,
          }}
          onFocus={e => { e.currentTarget.style.borderBottomColor = error ? ERR_COLOR : "#3A1335"; e.currentTarget.style.borderBottomWidth = "2px"; }}
          onBlur={e  => { e.currentTarget.style.borderBottomColor = base; e.currentTarget.style.borderBottomWidth = "1.5px"; }}
        />
        {suffix && (
          <span style={{
            position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)",
            fontSize: 11, color: "#80747b", fontWeight: 600, pointerEvents: "none",
          }}>{suffix}</span>
        )}
      </div>
      {error
        ? <p style={{ fontSize: 11, color: ERR_COLOR, marginTop: 2 }}>{error}</p>
        : hint && <p style={{ fontSize: 11, color: "#80747b", marginTop: 2 }}>{hint}</p>}
    </div>
  );
}

function Select({
  label, options, hint = "", value = "", onChange, loading: loadingOpts = false, error = "",
}: {
  label: string; options: { value: string; label: string }[];
  hint?: string; value?: string; onChange?: (v: string) => void; loading?: boolean; error?: string;
}) {
  const base = error ? ERR_COLOR : "#d2c2cb";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{
        fontSize: 11, fontWeight: 600, color: "#3A1335",
        letterSpacing: "0.10em", textTransform: "uppercase" as const,
      }}>{label}</label>
      <select
        value={value}
        onChange={e => onChange?.(e.target.value)}
        disabled={loadingOpts}
        aria-invalid={error ? true : undefined}
        style={{
          width: "100%", padding: "10px 0",
          background: "transparent", border: "none",
          borderBottom: `1.5px solid ${base}`,
          color: value ? "#1f1a1d" : "#80747b",
          fontSize: 14, outline: "none", appearance: "none" as const,
          boxSizing: "border-box" as const,
          cursor: loadingOpts ? "wait" : "pointer",
          opacity: loadingOpts ? 0.5 : 1,
          transition: "opacity 150ms ease",
        }}
        onFocus={e => { e.currentTarget.style.borderBottomColor = error ? ERR_COLOR : "#3A1335"; e.currentTarget.style.borderBottomWidth = "2px"; }}
        onBlur={e  => { e.currentTarget.style.borderBottomColor = base; e.currentTarget.style.borderBottomWidth = "1.5px"; }}
      >
        <option value="">{loadingOpts ? "Cargando…" : "Seleccionar…"}</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error
        ? <p style={{ fontSize: 11, color: ERR_COLOR, marginTop: 2 }}>{error}</p>
        : hint && <p style={{ fontSize: 11, color: "#80747b", marginTop: 2 }}>{hint}</p>}
    </div>
  );
}

function PrimaryBtn({ onClick, disabled = false, children }: {
  onClick?: () => void; disabled?: boolean; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%", padding: "12px 20px", borderRadius: 4, border: "none",
        backgroundColor: disabled ? "#d2c2cb" : "#3A1335",
        color: "#ffffff", fontSize: 14, fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "background-color 140ms ease, transform 140ms ease",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
      }}
      onMouseEnter={e => { if (!disabled) { e.currentTarget.style.backgroundColor = "#5A1D4F"; e.currentTarget.style.transform = "translateY(-1px)"; } }}
      onMouseLeave={e => { if (!disabled) { e.currentTarget.style.backgroundColor = "#3A1335"; e.currentTarget.style.transform = "translateY(0)"; } }}
      onMouseDown={e  => { if (!disabled) e.currentTarget.style.transform = "scale(0.97)"; }}
      onMouseUp={e    => { e.currentTarget.style.transform = "scale(1)"; }}
    >
      {children}
    </button>
  );
}

function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: "none", border: "none", cursor: "pointer",
      fontSize: 13, color: "#4A464A", marginBottom: 20, padding: 0,
    }}>
      ← Atrás
    </button>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: 10.5, fontWeight: 700, letterSpacing: "0.12em",
      textTransform: "uppercase" as const, color: "#3A1335",
      paddingBottom: 8, borderBottom: "1px solid rgba(58,19,53,0.10)", marginTop: 8,
    }}>
      {children}
    </p>
  );
}

function CheckToggle({ label, checked, onChange }: {
  label: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
      <div
        onClick={() => onChange(!checked)}
        style={{
          width: 18, height: 18, borderRadius: 4, flexShrink: 0,
          border: `1.5px solid ${checked ? "#3A1335" : "#d2c2cb"}`,
          backgroundColor: checked ? "#3A1335" : "transparent",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 140ms ease",
        }}
      >
        {checked && <span style={{ color: "white", fontSize: 10, lineHeight: 1 }}>✓</span>}
      </div>
      <span style={{ fontSize: 13, color: "#4A464A", lineHeight: 1.4 }}>{label}</span>
    </label>
  );
}

// ─── PERSONA FIELDS (reutilizable para asegurado y tomador) ───────────────────
function PersonaFields({
  data, onChange, errors = {},
}: {
  data: PersonaFormState;
  onChange: (k: keyof PersonaFormState, v: string) => void;
  errors?: FieldErrors<keyof PersonaFormState>;
}) {
  const NAC_OPTS = [
    { value: "V", label: "V — Venezolano/a" },
    { value: "E", label: "E — Extranjero/a" },
    { value: "J", label: "J — Jurídico" },
    { value: "G", label: "G — Gubernamental" },
  ];
  const SEXO_OPTS = [
    { value: "M", label: "Masculino" },
    { value: "F", label: "Femenino" },
    { value: "X", label: "Persona jurídica" },
  ];
  const CIVIL_OPTS = [
    { value: "S", label: "Soltero/a" },
    { value: "C", label: "Casado/a" },
    { value: "D", label: "Divorciado/a" },
    { value: "V", label: "Viudo/a" },
    { value: "U", label: "Unión estable" },
  ];
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Select label="Nacionalidad" options={NAC_OPTS} error={errors.nacionalidad}
          value={data.nacionalidad} onChange={v => onChange("nacionalidad", v)} />
        <Field label="Cédula / RIF" inputMode="numeric" maxLength={12} error={errors.cedulaRif}
          value={data.cedulaRif}
          onChange={v => onChange("cedulaRif", v)} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Nombres" value={data.nombres} error={errors.nombres} onChange={v => onChange("nombres", v)} />
        <Field label="Apellidos / Razón Social" error={errors.apellidosRazonSocial}
          value={data.apellidosRazonSocial} onChange={v => onChange("apellidosRazonSocial", v)} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Select label="Sexo" options={SEXO_OPTS} error={errors.sexo} value={data.sexo} onChange={v => onChange("sexo", v)} />
        <Select label="Estado civil" options={CIVIL_OPTS} error={errors.edoCivil} value={data.edoCivil} onChange={v => onChange("edoCivil", v)} />
      </div>
      <Field label="Fecha de nacimiento" placeholder="DD/MM/YYYY" inputMode="numeric" maxLength={10}
        hint="Dejar en blanco si es persona jurídica" error={errors.feNacimiento}
        value={data.feNacimiento} onChange={v => onChange("feNacimiento", v)} />
      <Field label="Correo electrónico" type="email" inputMode="email" error={errors.email}
        value={data.email} onChange={v => onChange("email", v)} />
      <Field label="Dirección de residencia" error={errors.direccion}
        value={data.direccion} onChange={v => onChange("direccion", v)} />
      <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: 12 }}>
        <Field label="Cód. área" placeholder="212" inputMode="numeric" maxLength={4} error={errors.cdAreaTlf}
          value={data.cdAreaTlf} onChange={v => onChange("cdAreaTlf", v)} />
        <Field label="Teléfono" type="tel" inputMode="tel" maxLength={12} error={errors.nuTlf}
          value={data.nuTlf} onChange={v => onChange("nuTlf", v)} />
      </div>
      <Field label="Profesión" hint="Dejar en blanco si es persona jurídica"
        value={data.profesion} onChange={v => onChange("profesion", v)} />
    </>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function CotizarPage() {
  const [step, setStep]       = useState<Step>(1);
  const [ramo, setRamo]       = useState<Ramo | null>(null);
  const [loading, setLoading] = useState(false);

  // ── Form state ───────────────────────────────────────────────────────────────
  const [empresa, setEmpresa] = useState<EmpresaForm>({
    razonSocial: "", rif: "", empleados: "", sector: "", facturacion: "", email: "", telefono: "",
  });
  const [autoData,         setAutoData]         = useState<AutoForm>({ marca: "", modelo: "", anio: "", valor: "", uso: "", nVehiculos: "" });
  const [saludData,        setSaludData]        = useState<SaludForm>({ nAsegurados: "", edadPromedio: "", cobertura: "" });
  const [hogarData,        setHogarData]        = useState<HogarFormState>(HOGAR_INIT);
  const [patrimonialData,  setPatrimonialData]  = useState<PatrimonialForm>({ tipoRiesgo: "", valorBienes: "", direccion: "", metros: "" });

  // ── API state — hogar selects ─────────────────────────────────────────────
  const [estadoOpts,      setEstadoOpts]      = useState<{ value: string; label: string }[]>([]);
  const [indoleOpts,      setIndoleOpts]      = useState<{ value: string; label: string }[]>([]);
  const [ciudades,        setCiudades]        = useState<Ciudad[]>([]);
  const [sectores,        setSectores]        = useState<Sector[]>([]);
  const [loadingListas,   setLoadingListas]   = useState(false);
  const [loadingCiudades, setLoadingCiudades] = useState(false);
  const [loadingSectores, setLoadingSectores] = useState(false);
  const [apiError,        setApiError]        = useState<string | null>(null);

  // ── Client-side validation state (hogar) ─────────────────────────────────
  type HogarErrors = {
    inmueble: FieldErrors<keyof HogarFormState["inmueble"]>;
    asegurado: FieldErrors<keyof PersonaFormState>;
    tomador: FieldErrors<keyof PersonaFormState>;
  };
  const [hogarErrors, setHogarErrors] = useState<HogarErrors | null>(null);

  // ── Results ──────────────────────────────────────────────────────────────────
  const [propuestasApi, setPropuestasApi] = useState<Propuesta[] | null>(null);

  // ── Effects — hogar API calls ─────────────────────────────────────────────
  // Each effect owns an AbortController so a stale in-flight response can never
  // clobber a newer selection. All state writes happen inside the async flow.
  // Parent-select changes clear dependent fields in the change handlers
  // (event-driven); stale option arrays are masked at render time.
  const cdEstado = hogarData.inmueble.cdEstado;
  const cdCiudad = hogarData.inmueble.cdCiudad;
  const [listasRetry, setListasRetry] = useState(0);
  const needsListas = ramo === "hogar" && estadoOpts.length === 0;

  useEffect(() => {
    if (!needsListas) return;
    const ctrl = new AbortController();
    void (async () => {
      setLoadingListas(true);
      setApiError(null);
      try {
        const res = await segurosCaracasClient.getListasIniciales(ctrl.signal);
        if (ctrl.signal.aborted) return;
        if (res.ok && "estados" in res.data) {
          setEstadoOpts(res.data.estados.map(e => ({ value: e.codigo, label: e.descripcion })));
          setIndoleOpts(res.data.indoles.map(i => ({ value: i.codigo, label: i.descripcion })));
        } else if (!res.ok && res.error !== "aborted") {
          setApiError("No se pudieron cargar los listados de Seguros Caracas.");
        }
      } finally {
        if (!ctrl.signal.aborted) setLoadingListas(false);
      }
    })().catch(() => {});
    return () => ctrl.abort();
  }, [needsListas, listasRetry]);

  useEffect(() => {
    if (!cdEstado) return;
    const ctrl = new AbortController();
    void (async () => {
      setLoadingCiudades(true);
      setCiudades([]);
      try {
        const res = await segurosCaracasClient.getCiudades(cdEstado, ctrl.signal);
        if (ctrl.signal.aborted) return;
        if (res.ok && "ciudades" in res.data) setCiudades(res.data.ciudades);
      } finally {
        if (!ctrl.signal.aborted) setLoadingCiudades(false);
      }
    })().catch(() => {});
    return () => ctrl.abort();
  }, [cdEstado]);

  useEffect(() => {
    if (!cdEstado || !cdCiudad) return;
    const ctrl = new AbortController();
    void (async () => {
      setLoadingSectores(true);
      setSectores([]);
      try {
        const res = await segurosCaracasClient.getSectores(cdEstado, cdCiudad, ctrl.signal);
        if (ctrl.signal.aborted) return;
        if (res.ok && "sectores" in res.data) setSectores(res.data.sectores);
      } finally {
        if (!ctrl.signal.aborted) setLoadingSectores(false);
      }
    })().catch(() => {});
    return () => ctrl.abort();
  }, [cdEstado, cdCiudad]);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const updE = (k: keyof EmpresaForm,     v: string) => setEmpresa(p        => ({ ...p, [k]: v }));
  const updA = (k: keyof AutoForm,        v: string) => setAutoData(p       => ({ ...p, [k]: v }));
  const updS = (k: keyof SaludForm,       v: string) => setSaludData(p      => ({ ...p, [k]: v }));
  const updP = (k: keyof PatrimonialForm, v: string) => setPatrimonialData(p => ({ ...p, [k]: v }));

  // Every hogar-form write is sanitised at the edge (strip non-digits, cap
  // length, collapse whitespace) so state only ever holds clean values.
  const updHI = (k: keyof HogarFormState["inmueble"], v: string) => {
    const clean = sanitizeInmuebleField(k, v);
    setHogarData(p => ({ ...p, inmueble: { ...p.inmueble, [k]: clean } }));
    if (hogarErrors) setHogarErrors(e => e && { ...e, inmueble: { ...e.inmueble, [k]: undefined } });
  };

  const updHA = (k: keyof PersonaFormState, v: string) => {
    const clean = sanitizePersonaField(k, v);
    setHogarData(p => ({ ...p, asegurado: { ...p.asegurado, [k]: clean } }));
    if (hogarErrors) setHogarErrors(e => e && { ...e, asegurado: { ...e.asegurado, [k]: undefined } });
  };

  const updHT = (k: keyof PersonaFormState, v: string) => {
    const clean = sanitizePersonaField(k, v);
    setHogarData(p => ({ ...p, tomador: { ...p.tomador, [k]: clean } }));
    if (hogarErrors) setHogarErrors(e => e && { ...e, tomador: { ...e.tomador, [k]: undefined } });
  };

  const clearInmuebleError = (k: keyof HogarFormState["inmueble"]) =>
    setHogarErrors(e => e && { ...e, inmueble: { ...e.inmueble, [k]: undefined } });

  const handleEstadoChange = (nextEstado: string) => {
    const deEstado = estadoOpts.find(o => o.value === nextEstado)?.label ?? "";
    // Reset every dependent field so no stale city/sector survives the change.
    setHogarData(p => ({
      ...p,
      inmueble: {
        ...p.inmueble,
        cdEstado: nextEstado, deEstado,
        cdCiudad: "", deCiudad: "", cdPostal: "", x: "", y: "",
        cdSector: "", deSector: "",
      },
    }));
    setSectores([]);
    clearInmuebleError("cdEstado");
  };

  const handleCiudadChange = (nextCiudad: string) => {
    const ciudad = ciudades.find(c => c.codigo === nextCiudad);
    setHogarData(p => ({
      ...p,
      inmueble: {
        ...p.inmueble,
        cdCiudad: nextCiudad,
        deCiudad: ciudad?.descripcion ?? "",
        cdPostal: ciudad?.cdPostal ?? "",
        x: ciudad?.x ?? "",
        y: ciudad?.y ?? "",
        cdSector: "", deSector: "",
      },
    }));
    clearInmuebleError("cdCiudad");
  };

  const handleSectorChange = (cdSector: string) => {
    const sector = sectores.find(s => s.codigo === cdSector);
    setHogarData(p => ({
      ...p,
      inmueble: { ...p.inmueble, cdSector, deSector: sector?.descripcion ?? "" },
    }));
    clearInmuebleError("cdSector");
  };

  /** Validate the hogar form client-side. Returns true when safe to submit. */
  const validateHogar = (): boolean => {
    const errs: HogarErrors = {
      inmueble: validateInmueble(hogarData.inmueble),
      asegurado: validatePersona(hogarData.asegurado),
      tomador: hogarData.tomadorIgualAsegurado ? {} : validatePersona(hogarData.tomador),
    };
    const bad = hasErrors(errs.inmueble) || hasErrors(errs.asegurado) || hasErrors(errs.tomador);
    setHogarErrors(bad ? errs : null);
    return !bad;
  };

  const handleCalcular = async () => {
    if (!CREDENTIALS_READY) return;
    // Never query the API with an incomplete / malformed hogar form.
    if (ramo === "hogar" && !validateHogar()) {
      setApiError("Revisá los campos marcados antes de calcular.");
      return;
    }
    setLoading(true);
    setApiError(null);
    try {
      const res = await segurosCaracasClient.getPropuestas();
      if (res.ok && "propuestas" in res.data) {
        setPropuestasApi(res.data.propuestas);
      } else {
        setApiError("No se pudieron obtener las cotizaciones en este momento.");
      }
    } finally {
      setLoading(false);
      setStep("results");
    }
  };

  const resetForm = () => {
    setStep(1); setRamo(null);
    setEmpresa({ razonSocial: "", rif: "", empleados: "", sector: "", facturacion: "", email: "", telefono: "" });
    setAutoData({ marca: "", modelo: "", anio: "", valor: "", uso: "", nVehiculos: "" });
    setSaludData({ nAsegurados: "", edadPromedio: "", cobertura: "" });
    setHogarData(HOGAR_INIT);
    setPatrimonialData({ tipoRiesgo: "", valorBienes: "", direccion: "", metros: "" });
    setPropuestasApi(null);
    setApiError(null);
    setHogarErrors(null);
    setCiudades([]); setSectores([]);
  };

  const currentStepNum = step === "results" ? 3 : (step as number);

  // ── Display cards (placeholder until credentials are ready + API returns) ────
  const displayCards: OfertaDisplay[] = propuestasApi
    ? propuestasApi.map(p => ({
        nombre: p.deConvenio,
        siglas: "SC",
        color: "#3A1335",
        prima_anual: p.mtPrima,
        prima_mensual: p.frecuencias.find(f => f.cdFrPago === "M")?.mtPrima ?? Math.round(p.mtPrima / 12),
        tag: p.nmPropuesta,
        score: 94,
        coberturas: [
          { label: "Moneda",       valor: p.cdMoneda },
          { label: "N° Propuesta", valor: p.nmPropuesta },
          { label: "Tasa cambio",  valor: p.taCambio > 0 ? String(p.taCambio) : "—" },
          { label: "Convenio",     valor: String(p.cdConvenio) },
        ],
        destacado: true,
      }))
    : OFERTAS_PLACEHOLDER;

  return (
    <div style={{ minHeight: "100dvh", backgroundColor: "#fff7f9", fontFamily: "var(--font-inter, var(--font-body, system-ui))" }}>

      {/* ── HEADER ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        height: 56, display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 24px",
        backgroundColor: "rgba(255,255,255,0.92)",
        borderBottom: "1px solid rgba(58,19,53,0.09)",
        backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
          <div style={{
            backgroundColor: "white", borderRadius: 7, padding: "4px 9px",
            overflow: "hidden", flexShrink: 0,
            boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
          }}>
            <Image
              src="/logos/logo-cabal.png"
              alt="Cabal Corretaje de Seguros"
              width={96} height={38}
              style={{ objectFit: "contain", display: "block" }}
            />
          </div>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <div style={{
            width: 7, height: 7, borderRadius: "50%",
            backgroundColor: CREDENTIALS_READY ? "#059669" : "#D97706",
            animation: "pulse 2s ease-in-out infinite",
          }} />
          <span style={{ fontSize: 12, color: "#4A464A", fontWeight: 500 }}>
            {CREDENTIALS_READY ? "Sistema operativo" : "En configuración"}
          </span>
        </div>
      </header>

      {/* ── CONTENIDO ── */}
      <main style={{ maxWidth: 640, margin: "0 auto", padding: "40px 24px 80px" }}>

        {/* Steps */}
        {step !== "results" && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 36 }}>
            {STEPS.map((label, i) => {
              const n      = i + 1;
              const done   = currentStepNum > n;
              const active = currentStepNum === n;
              return (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <StepDot n={n} active={active} done={done} />
                    <span style={{
                      fontSize: 12, fontWeight: 500,
                      color: active ? "#3A1335" : done ? "#3A1335" : "#7A7A8A",
                      display: "none",
                    }} className="sm:inline">{label}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div style={{
                      width: 32, height: 1,
                      backgroundColor: done ? "#3A1335" : "rgba(58,19,53,0.15)",
                      transition: "background-color 300ms ease",
                    }} />
                  )}
                </div>
              );
            })}
          </div>
        )}

        <AnimatePresence mode="wait" initial={false}>

          {/* ─── STEP 1: Empresa ─── */}
          {step === 1 && (
            <motion.div key="s1" {...fadeSlide} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px", color: "#3A1335", marginBottom: 4 }}>
                  Datos de la empresa
                </h1>
                <p style={{ fontSize: 13.5, color: "#4A464A", lineHeight: 1.6 }}>
                  Información básica para generar una cotización precisa.
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <Field label="Razón Social"
                  value={empresa.razonSocial} onChange={v => updE("razonSocial", v)} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Field label="RIF" hint="Ej: J-12345678-9"
                    value={empresa.rif} onChange={v => updE("rif", v)} />
                  <Field label="N° de empleados" type="number"
                    value={empresa.empleados} onChange={v => updE("empleados", v)} />
                </div>
                <Select
                  label="Sector industrial"
                  options={[
                    { value: "manufactura",  label: "Manufactura"  },
                    { value: "servicios",    label: "Servicios"    },
                    { value: "comercio",     label: "Comercio"     },
                    { value: "tecnologia",   label: "Tecnología"   },
                    { value: "construccion", label: "Construcción" },
                    { value: "salud",        label: "Salud"        },
                    { value: "educacion",    label: "Educación"    },
                    { value: "otro",         label: "Otro"         },
                  ]}
                  hint="Clasifica el giro principal de tu empresa"
                  value={empresa.sector} onChange={v => updE("sector", v)}
                />
                <Field label="Facturación anual estimada" type="number" suffix="USD"
                  value={empresa.facturacion} onChange={v => updE("facturacion", v)} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Field label="Email de contacto" type="email"
                    value={empresa.email} onChange={v => updE("email", v)} />
                  <Field label="Teléfono" type="tel" hint="+58…"
                    value={empresa.telefono} onChange={v => updE("telefono", v)} />
                </div>
              </div>

              <PrimaryBtn onClick={() => setStep(2)}>
                Continuar →
              </PrimaryBtn>
            </motion.div>
          )}

          {/* ─── STEP 2: Ramo ─── */}
          {step === 2 && (
            <motion.div key="s2" {...fadeSlide} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div>
                <BackBtn onClick={() => setStep(1)} />
                <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px", color: "#3A1335", marginBottom: 4 }}>
                  ¿Qué ramo deseas cotizar?
                </h1>
                <p style={{ fontSize: 13.5, color: "#4A464A" }}>
                  Seleccioná el tipo de seguro para tu empresa.
                </p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {RAMOS.map(r => {
                  const selected = ramo === r.id;
                  return (
                    <button
                      key={r.id}
                      onClick={() => setRamo(r.id)}
                      style={{
                        padding: "16px 14px", borderRadius: 12, border: "1.5px solid",
                        borderColor: selected ? r.color + "50" : "rgba(58,19,53,0.12)",
                        backgroundColor: selected ? r.color + "0A" : "#FFFFFF",
                        textAlign: "left", cursor: "pointer",
                        boxShadow: selected ? `0 0 0 3px ${r.color}15` : "none",
                        transition: "border-color 150ms ease, background-color 150ms ease, box-shadow 150ms ease",
                        display: "flex", flexDirection: "column", gap: 8,
                      }}
                    >
                      <div style={{
                        width: 36, height: 36, borderRadius: 9,
                        backgroundColor: r.color + "15",
                        border: `1px solid ${r.color}22`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 17,
                      }}>
                        {r.icon}
                      </div>
                      <div>
                        <p style={{ fontSize: 13.5, fontWeight: 700, color: "#3A1335", marginBottom: 2 }}>{r.label}</p>
                        <p style={{ fontSize: 12, color: "#4A464A", lineHeight: 1.4 }}>{r.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <PrimaryBtn onClick={() => { if (ramo) setStep(3); }} disabled={!ramo}>
                Continuar →
              </PrimaryBtn>
            </motion.div>
          )}

          {/* ─── STEP 3: Detalles ─── */}
          {step === 3 && !loading && (
            <motion.div key="s3" {...fadeSlide} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div>
                <BackBtn onClick={() => setStep(2)} />
                <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px", color: "#3A1335", marginBottom: 4 }}>
                  Detalles del riesgo
                </h1>
                <p style={{ fontSize: 13.5, color: "#4A464A" }}>
                  Completá la información específica para calcular las mejores tarifas.
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

                {/* ── Automóvil ── */}
                {ramo === "automovil" && <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <Field label="Marca"  value={autoData.marca}  onChange={v => updA("marca", v)} />
                    <Field label="Modelo" value={autoData.modelo} onChange={v => updA("modelo", v)} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <Field label="Año" type="number"
                      value={autoData.anio} onChange={v => updA("anio", v)} />
                    <Field label="Valor asegurado" type="number" suffix="USD"
                      value={autoData.valor} onChange={v => updA("valor", v)} />
                  </div>
                  <Select label="Uso del vehículo"
                    options={[
                      { value: "particular", label: "Particular" },
                      { value: "comercial",  label: "Comercial"  },
                      { value: "carga",      label: "Carga"      },
                    ]}
                    value={autoData.uso} onChange={v => updA("uso", v)}
                  />
                  <Field label="N° de vehículos (si es flota)" type="number"
                    hint="Dejá en blanco si es un solo vehículo"
                    value={autoData.nVehiculos} onChange={v => updA("nVehiculos", v)} />
                </>}

                {/* ── Salud ── */}
                {ramo === "salud" && <>
                  <Field label="N° de asegurados" type="number"
                    value={saludData.nAsegurados} onChange={v => updS("nAsegurados", v)} />
                  <Field label="Edad promedio del grupo" type="number" suffix="años"
                    value={saludData.edadPromedio} onChange={v => updS("edadPromedio", v)} />
                  <Select label="Cobertura deseada"
                    options={[
                      { value: "basica",     label: "Básica"     },
                      { value: "intermedia", label: "Intermedia" },
                      { value: "premium",    label: "Premium"    },
                    ]}
                    value={saludData.cobertura} onChange={v => updS("cobertura", v)}
                  />
                </>}

                {/* ── Hogar ── */}
                {ramo === "hogar" && <>
                  <SectionTitle>Datos del inmueble</SectionTitle>

                  {apiError && (
                    <div style={{
                      fontSize: 12, color: "#B45309", backgroundColor: "rgba(217,119,6,0.08)",
                      border: "1px solid rgba(217,119,6,0.22)", borderRadius: 8,
                      padding: "8px 12px", lineHeight: 1.5,
                      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                    }}>
                      <span>{apiError}</span>
                      {!loadingListas && (
                        <button
                          type="button"
                          onClick={() => { setEstadoOpts([]); setListasRetry(n => n + 1); }}
                          style={{
                            flexShrink: 0, fontSize: 11, fontWeight: 700, color: "#B45309",
                            background: "transparent", border: "1px solid rgba(217,119,6,0.4)",
                            borderRadius: 6, padding: "3px 10px", cursor: "pointer",
                          }}
                        >
                          Reintentar
                        </button>
                      )}
                    </div>
                  )}

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <Select
                      label="Estado"
                      options={estadoOpts}
                      hint={loadingListas ? "Cargando desde Seguros Caracas…" : undefined}
                      loading={loadingListas}
                      error={hogarErrors?.inmueble.cdEstado}
                      value={hogarData.inmueble.cdEstado}
                      onChange={handleEstadoChange}
                    />
                    <Select
                      label="Ciudad"
                      options={(cdEstado ? ciudades : []).map(c => ({ value: c.codigo, label: c.descripcion }))}
                      hint="Depende del estado seleccionado"
                      loading={loadingCiudades}
                      error={hogarErrors?.inmueble.cdCiudad}
                      value={hogarData.inmueble.cdCiudad}
                      onChange={handleCiudadChange}
                    />
                  </div>

                  <Select
                    label="Sector / Urbanización"
                    options={(cdCiudad ? sectores : []).map(s => ({ value: s.codigo, label: s.descripcion }))}
                    hint="Depende de la ciudad seleccionada"
                    loading={loadingSectores}
                    error={hogarErrors?.inmueble.cdSector}
                    value={hogarData.inmueble.cdSector}
                    onChange={handleSectorChange}
                  />

                  <Select
                    label="Índole del inmueble"
                    error={hogarErrors?.inmueble.cdIndole}
                    options={indoleOpts.length > 0 ? indoleOpts : [
                      { value: "1", label: "Apartamento Residencial" },
                      { value: "2", label: "Casa Residencial"        },
                      { value: "3", label: "Local Comercial"         },
                      { value: "4", label: "Oficina"                 },
                    ]}
                    value={hogarData.inmueble.cdIndole}
                    onChange={v => {
                      const opts = indoleOpts.length > 0 ? indoleOpts : [
                        { value: "1", label: "Apartamento Residencial" },
                        { value: "2", label: "Casa Residencial"        },
                        { value: "3", label: "Local Comercial"         },
                        { value: "4", label: "Oficina"                 },
                      ];
                      updHI("cdIndole", v);
                      updHI("deInmueble", opts.find(o => o.value === v)?.label ?? "");
                    }}
                  />

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <Field label="Nombre del inmueble" placeholder="Ej: Torre B, Piso 4, Apto 4-C"
                      error={hogarErrors?.inmueble.deInmueble}
                      value={hogarData.inmueble.deInmueble} onChange={v => updHI("deInmueble", v)} />
                    <Field label="Calle / Avenida" error={hogarErrors?.inmueble.deCalle}
                      value={hogarData.inmueble.deCalle} onChange={v => updHI("deCalle", v)} />
                  </div>
                  <Field label="Dirección (línea 1)" hint="Máximo 50 caracteres"
                    error={hogarErrors?.inmueble.deDireccion1} maxLength={50}
                    value={hogarData.inmueble.deDireccion1} onChange={v => updHI("deDireccion1", v)} />
                  <Field label="Dirección (línea 2)" hint="Opcional — máximo 50 caracteres"
                    error={hogarErrors?.inmueble.deDireccion2} maxLength={50}
                    value={hogarData.inmueble.deDireccion2} onChange={v => updHI("deDireccion2", v)} />

                  <SectionTitle>Datos del asegurado</SectionTitle>
                  <PersonaFields data={hogarData.asegurado} onChange={updHA} errors={hogarErrors?.asegurado} />

                  <SectionTitle>Datos del tomador</SectionTitle>
                  <CheckToggle
                    label="El tomador es el mismo que el asegurado"
                    checked={hogarData.tomadorIgualAsegurado}
                    onChange={v => setHogarData(p => ({ ...p, tomadorIgualAsegurado: v }))}
                  />
                  {!hogarData.tomadorIgualAsegurado && (
                    <PersonaFields data={hogarData.tomador} onChange={updHT} errors={hogarErrors?.tomador} />
                  )}
                </>}

                {/* ── Patrimoniales ── */}
                {ramo === "patrimoniales" && <>
                  <Field label="Tipo de riesgo"
                    value={patrimonialData.tipoRiesgo} onChange={v => updP("tipoRiesgo", v)} />
                  <Field label="Valor de bienes" type="number" suffix="USD"
                    value={patrimonialData.valorBienes} onChange={v => updP("valorBienes", v)} />
                  <Field label="Dirección del riesgo"
                    value={patrimonialData.direccion} onChange={v => updP("direccion", v)} />
                  <Field label="Metros cuadrados" type="number" suffix="m²"
                    value={patrimonialData.metros} onChange={v => updP("metros", v)} />
                </>}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <PrimaryBtn onClick={handleCalcular} disabled={!CREDENTIALS_READY}>
                  {CREDENTIALS_READY ? "✦ Calcular cotizaciones" : "⏸ Pendiente de credenciales"}
                </PrimaryBtn>
                {!CREDENTIALS_READY && (
                  <p style={{ textAlign: "center", fontSize: 11, color: "#7A7A8A", lineHeight: 1.5 }}>
                    El botón se activará cuando se configuren las credenciales del productor.
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* ─── LOADING ─── */}
          {loading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ display: "flex", flexDirection: "column", gap: 20 }}
            >
              <div>
                <div style={{ height: 26, width: 220, borderRadius: 6, backgroundColor: "rgba(58,19,53,0.07)", marginBottom: 8 }} />
                <div style={{ height: 16, width: 160, borderRadius: 6, backgroundColor: "rgba(58,19,53,0.04)" }} />
              </div>

              <div style={{
                borderRadius: 14, border: "1.5px solid rgba(58,19,53,0.10)",
                backgroundColor: "#FFFFFF", padding: "20px 18px",
                display: "flex", flexDirection: "column", gap: 14,
              }}>
                {[
                  { label: "Conectando con aseguradoras", delay: "0ms"    },
                  { label: "Calculando primas",           delay: "600ms"  },
                  { label: "Comparando coberturas",       delay: "1200ms" },
                ].map(s => (
                  <div key={s.label} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    animation: `fadeInLeft 0.3s ease both`, animationDelay: s.delay,
                  }}>
                    <div style={{
                      width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
                      backgroundColor: "#5A1D4F", animation: "pulse 1.5s ease-in-out infinite",
                    }} />
                    <span style={{ fontSize: 13, color: "#4A464A" }}>{s.label}</span>
                  </div>
                ))}
              </div>

              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  borderRadius: 14, border: "1.5px solid rgba(58,19,53,0.09)",
                  backgroundColor: "#FFFFFF", padding: "20px",
                  animation: `fadeInLeft 0.25s ease ${i * 80}ms both`,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: "rgba(58,19,53,0.07)" }} />
                      <div>
                        <div style={{ width: 130, height: 13, borderRadius: 4, backgroundColor: "rgba(58,19,53,0.07)", marginBottom: 6 }} />
                        <div style={{ width: 90,  height: 10, borderRadius: 4, backgroundColor: "rgba(58,19,53,0.04)" }} />
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ width: 70, height: 20, borderRadius: 4, backgroundColor: "rgba(58,19,53,0.07)", marginBottom: 4 }} />
                      <div style={{ width: 50, height: 10, borderRadius: 4, backgroundColor: "rgba(58,19,53,0.04)" }} />
                    </div>
                  </div>
                  <div style={{ height: 4, borderRadius: 99, backgroundColor: "rgba(58,19,53,0.04)", marginBottom: 14 }} />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {[0, 1, 2, 3].map(j => (
                      <div key={j}>
                        <div style={{ width: "60%", height: 9,  borderRadius: 3, backgroundColor: "rgba(58,19,53,0.04)", marginBottom: 4 }} />
                        <div style={{ width: "80%", height: 11, borderRadius: 3, backgroundColor: "rgba(58,19,53,0.07)" }} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {/* ─── RESULTS ─── */}
          {step === "results" && !loading && (
            <motion.div key="results" {...fadeUp} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.4px", color: "#3A1335", marginBottom: 4 }}>
                    Comparativa de cotizaciones
                  </h2>
                  <p style={{ fontSize: 12.5, color: "#4A464A" }}>
                    {displayCards.length} aseguradora{displayCards.length !== 1 ? "s" : ""} · válida 48 h
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  {!CREDENTIALS_READY && (
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 99,
                      backgroundColor: "rgba(217,119,6,0.10)", color: "#B45309",
                      border: "1px solid rgba(217,119,6,0.22)",
                    }}>
                      ⚠ Datos de simulación
                    </span>
                  )}
                  <button
                    onClick={resetForm}
                    style={{
                      fontSize: 12, padding: "5px 12px", borderRadius: 8,
                      border: "1.5px solid rgba(58,19,53,0.14)",
                      backgroundColor: "#FFFFFF", color: "#4A464A", cursor: "pointer",
                    }}
                  >
                    Nueva cotización
                  </button>
                </div>
              </div>

              {displayCards.map((oferta, i) => (
                <motion.div
                  key={oferta.nombre + i}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.10, duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    borderRadius: 8,
                    border: `1px solid ${oferta.destacado ? "#3A1335" : "#d2c2cb"}`,
                    backgroundColor: "#FFFFFF",
                    overflow: "hidden",
                    boxShadow: oferta.destacado
                      ? "0px 10px 40px rgba(58, 19, 53, 0.12)"
                      : "0 2px 8px rgba(58,19,53,0.04)",
                  }}
                >
                  <div style={{ height: 3, backgroundColor: oferta.color }} />

                  <div style={{ padding: "20px 20px 18px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: 11, flexShrink: 0,
                          backgroundColor: oferta.color + "12",
                          border: `1.5px solid ${oferta.color}20`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 11, fontWeight: 800, color: oferta.color, letterSpacing: "0.02em",
                        }}>
                          {oferta.siglas}
                        </div>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                            <p style={{ fontSize: 14, fontWeight: 700, color: "#3A1335" }}>{oferta.nombre}</p>
                            <span style={{
                              fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
                              backgroundColor: oferta.color + "12", color: oferta.color,
                              border: `1px solid ${oferta.color}20`,
                            }}>{oferta.tag}</span>
                          </div>
                          <p style={{ fontSize: 12, color: "#4A464A", marginTop: 2 }}>Póliza anual · 1 año vigencia</p>
                        </div>
                      </div>

                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        {oferta.prima_anual > 0 ? (
                          <>
                            <p style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-1px", color: "#3A1335", lineHeight: 1 }}>
                              ${oferta.prima_anual.toLocaleString()}
                            </p>
                            <p style={{ fontSize: 11, color: "#7A7A8A", marginTop: 1 }}>USD / año</p>
                            <p style={{ fontSize: 12, color: oferta.color, fontWeight: 700, marginTop: 2 }}>
                              ~${oferta.prima_mensual} / mes
                            </p>
                          </>
                        ) : (
                          <p style={{ fontSize: 13, color: "#7A7A8A", fontStyle: "italic" }}>
                            —
                          </p>
                        )}
                      </div>
                    </div>

                    <div style={{ marginBottom: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 10, fontWeight: 600, color: "#7A7A8A", letterSpacing: "0.06em", textTransform: "uppercase" as const }}>
                          Score de cobertura
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: oferta.color }}>{oferta.score}/100</span>
                      </div>
                      <div style={{ height: 5, backgroundColor: "rgba(58,19,53,0.07)", borderRadius: 99, overflow: "hidden" }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${oferta.score}%` }}
                          transition={{ delay: 0.25 + i * 0.1, duration: 0.75, ease: [0.23, 1, 0.32, 1] }}
                          style={{ height: "100%", borderRadius: 99, backgroundColor: oferta.color }}
                        />
                      </div>
                    </div>

                    <div style={{ height: 1, backgroundColor: "rgba(58,19,53,0.08)", marginBottom: 14 }} />

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px", marginBottom: 16 }}>
                      {oferta.coberturas.map(c => (
                        <div key={c.label}>
                          <p style={{ fontSize: 10, fontWeight: 600, color: "#7A7A8A", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>
                            {c.label}
                          </p>
                          <p style={{ fontSize: 12.5, color: "#4A4560", marginTop: 2, fontWeight: c.valor.startsWith("—") ? 400 : 500 }}>
                            {c.valor}
                          </p>
                        </div>
                      ))}
                    </div>

                    <button
                      disabled={!CREDENTIALS_READY}
                      style={{
                        width: "100%", padding: "11px 16px", borderRadius: 4,
                        backgroundColor: CREDENTIALS_READY
                          ? (oferta.destacado ? "#C2A378" : "transparent")
                          : "rgba(58,19,53,0.06)",
                        color: CREDENTIALS_READY
                          ? (oferta.destacado ? "#fff" : "#3A1335")
                          : "#7A7A8A",
                        border: oferta.destacado && CREDENTIALS_READY ? "none" : "1.5px solid #d2c2cb",
                        fontSize: 13.5, fontWeight: 600,
                        cursor: CREDENTIALS_READY ? "pointer" : "not-allowed",
                        transition: "background-color 140ms ease, border-color 140ms ease, transform 140ms ease",
                      }}
                      onMouseEnter={e => {
                        if (!CREDENTIALS_READY) return;
                        if (oferta.destacado) e.currentTarget.style.backgroundColor = "#B8956A";
                        else e.currentTarget.style.borderColor = "#3A1335";
                        e.currentTarget.style.transform = "translateY(-1px)";
                      }}
                      onMouseLeave={e => {
                        if (!CREDENTIALS_READY) return;
                        if (oferta.destacado) e.currentTarget.style.backgroundColor = "#C2A378";
                        else e.currentTarget.style.borderColor = "#d2c2cb";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      {CREDENTIALS_READY ? "Solicitar esta póliza →" : "Disponible al activar credenciales"}
                    </button>
                  </div>
                </motion.div>
              ))}

              {!CREDENTIALS_READY && (
                <p style={{ textAlign: "center", fontSize: 11.5, color: "#7A7A8A", paddingTop: 4, lineHeight: 1.6 }}>
                  Los precios y coberturas son simulaciones de referencia.
                  Los valores reales serán provistos por Seguros Caracas al activar las credenciales.
                </p>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
        @keyframes fadeInLeft {
          from { opacity: 0; transform: translateX(-8px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @media (max-width: 480px) {
          .sm\\:inline { display: inline !important; }
        }
        input::placeholder { color: #80747b; }
        select option { color: #1f1a1d; }
      `}</style>
    </div>
  );
}
