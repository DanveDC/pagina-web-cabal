"use client";

import { useState, useEffect, useCallback } from "react";
import { segurosCaracasClient } from "@/lib/api/seguros-caracas";
import {
  buildSuscribirPayload,
  validatePersona,
  validateInmueble,
  sanitizePersonaField,
  sanitizeInmuebleField,
  hasErrors,
  checkClienteQuery,
} from "@/lib/validation/seguros-caracas";
import {
  PERSONA_EMPTY,
  type PersonaFormState,
  type HogarFormState,
} from "@/types/seguros-caracas";
import type {
  ListasInicialesOk,
  CiudadesOk,
  SectoresOk,
  PropuestasOk,
  Propuesta,
  FrecuenciaPago,
  CatalogItem,
} from "@/types/seguros-caracas";

// ─── SVG Icons ───────────────────────────────────────────────────────────────

const CheckCircleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);
const HomeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);
const UserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);
const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const ArrowRightIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);
const ArrowLeftIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
  </svg>
);
const ShieldIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

// ─── Constants ───────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: "Plan" },
  { id: 2, label: "Inmueble" },
  { id: 3, label: "Asegurado" },
  { id: 4, label: "Tomador" },
  { id: 5, label: "Confirmar" },
];

const INMUEBLE_EMPTY: HogarFormState["inmueble"] = {
  cdEstado: "", deEstado: "",
  cdCiudad: "", deCiudad: "",
  cdSector: "", deSector: "",
  cdPostal: "", x: "", y: "",
  cdIndole: "", deInmueble: "",
  deCalle: "", deDireccion1: "", deDireccion2: "",
};

// ─── Shared UI primitives ────────────────────────────────────────────────────

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label style={{ display: "block", fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#7a6d74", marginBottom: "6px" }}>
      {children}{required && <span style={{ color: "#DC2626", marginLeft: 2 }}>*</span>}
    </label>
  );
}

function Field({ label, error, children, required }: { label: string; error?: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <Label required={required}>{label}</Label>
      {children}
      {error && <p style={{ marginTop: "4px", fontSize: "12px", color: "#DC2626" }}>{error}</p>}
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "10px 0", background: "transparent",
  border: "none", borderBottom: "1.5px solid #d2c2cb",
  color: "#1f1a1d", fontSize: "14px", outline: "none",
  fontFamily: "var(--font-body, system-ui)",
  boxSizing: "border-box" as const,
  transition: "border-color 200ms ease",
};

const selectStyle = {
  ...inputStyle,
  cursor: "pointer",
  appearance: "none" as const,
  WebkitAppearance: "none" as const,
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2380747b' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 4px center",
  paddingRight: "20px",
};

function TextInput({ value, onChange, placeholder, type = "text", disabled }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string; disabled?: boolean;
}) {
  return (
    <input
      type={type} value={value} placeholder={placeholder} disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      style={{ ...inputStyle, opacity: disabled ? 0.5 : 1 }}
      onFocus={(e) => { e.target.style.borderBottomColor = "#3A1335"; e.target.style.borderBottomWidth = "2px"; }}
      onBlur={(e) => { e.target.style.borderBottomColor = "#d2c2cb"; e.target.style.borderBottomWidth = "1.5px"; }}
    />
  );
}

function SelectInput({ value, onChange, options, placeholder, disabled }: {
  value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string; disabled?: boolean;
}) {
  return (
    <select
      value={value} disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      style={{ ...selectStyle, opacity: disabled ? 0.5 : 1, color: value ? "#1f1a1d" : "#80747b" }}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

// ─── Stepper ─────────────────────────────────────────────────────────────────

function Stepper({ current }: { current: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0", marginBottom: "40px" }}>
      {STEPS.map((s, i) => {
        const done = s.id < current;
        const active = s.id === current;
        return (
          <div key={s.id} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : "none" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
              <div style={{
                width: "32px", height: "32px", borderRadius: "50%",
                backgroundColor: done || active ? "#3A1335" : "#f5ebef",
                border: `2px solid ${done || active ? "#3A1335" : "#d2c2cb"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: done || active ? "#fff" : "#7a6d74",
                fontSize: "12px", fontWeight: 700,
                transition: "all 200ms ease",
              }}>
                {done ? <CheckCircleIcon /> : s.id}
              </div>
              <span style={{ fontSize: "10px", fontWeight: active ? 700 : 500, color: active ? "#3A1335" : "#7a6d74", whiteSpace: "nowrap" }}>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: "2px", backgroundColor: done ? "#3A1335" : "#d2c2cb", margin: "0 4px", marginBottom: "16px", transition: "background-color 200ms ease" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Step 1: Selección de Plan ───────────────────────────────────────────────

function StepPlan({
  onNext,
}: {
  onNext: (plan: Propuesta, freq: FrecuenciaPago) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [propuestas, setPropuestas] = useState<Propuesta[]>([]);
  const [selected, setSelected] = useState<{ plan: Propuesta; freq: FrecuenciaPago } | null>(null);

  useEffect(() => {
    segurosCaracasClient.getPropuestas("", "")
      .then((r) => {
        if ("cdError" in r && r.cdError === 0) setPropuestas((r as PropuestasOk).propuestas);
        else setError("No se pudieron cargar los planes. Verifique la conexión con Seguros Caracas.");
      })
      .catch(() => setError("Error al conectar con Seguros Caracas."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ textAlign: "center", padding: "60px 0", color: "#7a6d74" }}>
      <div style={{ fontSize: "14px" }}>Cargando planes disponibles…</div>
    </div>
  );

  if (error) return (
    <div style={{ padding: "24px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", color: "#DC2626", fontSize: "14px" }}>
      {error}
    </div>
  );

  return (
    <div>
      <h2 style={{ fontFamily: "var(--font-display, Georgia, serif)", fontSize: "22px", fontWeight: 700, color: "#3A1335", marginBottom: "8px" }}>
        Seleccione un plan
      </h2>
      <p style={{ fontSize: "14px", color: "#7a6d74", marginBottom: "28px" }}>
        Planes HOGAR disponibles para el convenio activo.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "32px" }}>
        {propuestas.map((p) => {
          const isSelected = selected?.plan.cdOpcion === p.cdOpcion;
          return (
            <div key={p.cdOpcion} style={{
              border: `2px solid ${isSelected ? "#3A1335" : "#d2c2cb"}`,
              borderRadius: "8px", padding: "20px",
              backgroundColor: isSelected ? "#f5ebef" : "#fff",
              cursor: "pointer",
              transition: "all 140ms cubic-bezier(0.23,1,0.32,1)",
            }} onClick={() => { if (!isSelected) setSelected(null); }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                <div>
                  <div style={{ fontWeight: 700, color: "#1f1a1d", fontSize: "15px" }}>{p.nmPropuesta}</div>
                  <div style={{ fontSize: "12px", color: "#7a6d74", marginTop: "2px" }}>Convenio {p.cdConvenio} · {p.cdMoneda}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "18px", fontWeight: 700, color: "#3A1335" }}>
                    {p.cdMoneda} {p.mtPrima.toLocaleString("es-VE", { minimumFractionDigits: 2 })}
                  </div>
                  <div style={{ fontSize: "11px", color: "#7a6d74" }}>prima anual</div>
                </div>
              </div>

              <div style={{ borderTop: "1px solid #d2c2cb", paddingTop: "12px" }}>
                <div style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#7a6d74", marginBottom: "8px" }}>Frecuencia de pago</div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {p.frecuencias.map((f) => {
                    const freqSel = selected?.plan.cdOpcion === p.cdOpcion && selected?.freq.cdFrPago === f.cdFrPago;
                    return (
                      <button
                        key={f.cdFrPago}
                        onClick={(e) => { e.stopPropagation(); setSelected({ plan: p, freq: f }); }}
                        style={{
                          padding: "6px 14px", borderRadius: "4px", fontSize: "13px",
                          fontWeight: freqSel ? 700 : 500,
                          border: `1.5px solid ${freqSel ? "#3A1335" : "#d2c2cb"}`,
                          backgroundColor: freqSel ? "#3A1335" : "transparent",
                          color: freqSel ? "#fff" : "#4e444b",
                          cursor: "pointer",
                          transition: "all 140ms ease",
                        }}>
                        {f.deFrPago} · {p.cdMoneda} {f.mtPrima.toLocaleString("es-VE", { minimumFractionDigits: 2 })}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          disabled={!selected}
          onClick={() => selected && onNext(selected.plan, selected.freq)}
          style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            padding: "11px 24px", borderRadius: "4px", fontSize: "14px", fontWeight: 600,
            backgroundColor: selected ? "#3A1335" : "#d2c2cb",
            color: "#fff", border: "none", cursor: selected ? "pointer" : "not-allowed",
            transition: "background-color 140ms ease",
          }}>
          Continuar <ArrowRightIcon />
        </button>
      </div>
    </div>
  );
}

// ─── Step 2: Datos del Inmueble ──────────────────────────────────────────────

function StepInmueble({
  onNext, onBack,
}: {
  onNext: (inmueble: HogarFormState["inmueble"]) => void;
  onBack: () => void;
}) {
  const [listas, setListas] = useState<ListasInicialesOk | null>(null);
  const [ciudades, setCiudades] = useState<CiudadesOk["ciudades"]>([]);
  const [sectores, setSectores] = useState<SectoresOk["sectores"]>([]);
  const [loadingCiudades, setLoadingCiudades] = useState(false);
  const [loadingSectores, setLoadingSectores] = useState(false);
  const [form, setForm] = useState<HogarFormState["inmueble"]>(INMUEBLE_EMPTY);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    segurosCaracasClient.getListasIniciales().then((r) => {
      if ("cdError" in r && r.cdError === 0) setListas(r as ListasInicialesOk);
    });
  }, []);

  const handleEstado = useCallback(async (cdEstado: string) => {
    const found = listas?.estados.find((e) => e.codigo === cdEstado);
    setForm((f) => ({ ...f, cdEstado, deEstado: found?.descripcion ?? "", cdCiudad: "", deCiudad: "", cdSector: "", deSector: "", cdPostal: "", x: "", y: "" }));
    setCiudades([]); setSectores([]);
    if (!cdEstado) return;
    setLoadingCiudades(true);
    const r = await segurosCaracasClient.getCiudades(cdEstado);
    if ("cdError" in r && r.cdError === 0) setCiudades((r as CiudadesOk).ciudades);
    setLoadingCiudades(false);
  }, [listas]);

  const handleCiudad = useCallback(async (cdCiudad: string) => {
    const found = ciudades.find((c) => c.codigo === cdCiudad);
    setForm((f) => ({ ...f, cdCiudad, deCiudad: found?.descripcion ?? "", cdSector: "", deSector: "", cdPostal: found?.cdPostal ?? "", x: found?.x ?? "", y: found?.y ?? "" }));
    setSectores([]);
    if (!cdCiudad || !form.cdEstado) return;
    setLoadingSectores(true);
    const r = await segurosCaracasClient.getSectores(form.cdEstado, cdCiudad);
    if ("cdError" in r && r.cdError === 0) setSectores((r as SectoresOk).sectores);
    setLoadingSectores(false);
  }, [ciudades, form.cdEstado]);

  const handleSector = (cdSector: string) => {
    const found = sectores.find((s) => s.codigo === cdSector);
    setForm((f) => ({ ...f, cdSector, deSector: found?.descripcion ?? "", x: found?.x ?? f.x, y: found?.y ?? f.y }));
  };

  const set = (k: keyof HogarFormState["inmueble"], v: string) => {
    const clean = sanitizeInmuebleField(k, v);
    setForm((f) => ({ ...f, [k]: clean }));
    if (submitted) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const handleNext = () => {
    setSubmitted(true);
    const errs = validateInmueble(form);
    if (hasErrors(errs)) { setErrors(errs); return; }
    onNext(form);
  };

  const estadoOpts = (listas?.estados ?? []).map((e) => ({ value: e.codigo, label: e.descripcion }));
  const indoleOpts = (listas?.indoles ?? []).map((e) => ({ value: e.codigo, label: e.descripcion }));
  const ciudadOpts = ciudades.map((c) => ({ value: c.codigo, label: c.descripcion }));
  const sectorOpts = sectores.map((s) => ({ value: s.codigo, label: s.descripcion }));

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
        <HomeIcon />
        <h2 style={{ fontFamily: "var(--font-display, Georgia, serif)", fontSize: "22px", fontWeight: 700, color: "#3A1335" }}>Datos del inmueble</h2>
      </div>
      <p style={{ fontSize: "14px", color: "#7a6d74", marginBottom: "28px" }}>Ubicación y características del bien a asegurar.</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
        <Field label="Estado" error={errors.cdEstado} required>
          <SelectInput value={form.cdEstado} onChange={handleEstado} options={estadoOpts} placeholder="— Seleccione —" disabled={!listas} />
        </Field>

        <Field label={loadingCiudades ? "Ciudad (cargando…)" : "Ciudad"} error={errors.cdCiudad} required>
          <SelectInput value={form.cdCiudad} onChange={handleCiudad} options={ciudadOpts} placeholder="— Seleccione —" disabled={!form.cdEstado || loadingCiudades} />
        </Field>

        <Field label={loadingSectores ? "Sector (cargando…)" : "Sector"} error={errors.cdSector} required>
          <SelectInput value={form.cdSector} onChange={handleSector} options={sectorOpts} placeholder="— Seleccione —" disabled={!form.cdCiudad || loadingSectores} />
        </Field>

        <Field label="Índole del inmueble" error={errors.cdIndole} required>
          <SelectInput value={form.cdIndole} onChange={(v) => { const found = indoleOpts.find((o) => o.value === v); setForm((f) => ({ ...f, cdIndole: v, deInmueble: found?.label ?? "" })); }} options={indoleOpts} placeholder="— Seleccione —" disabled={!listas} />
        </Field>

        <Field label="Calle / Avenida" error={errors.deCalle} required>
          <TextInput value={form.deCalle} onChange={(v) => set("deCalle", v)} placeholder="Av. Principal" />
        </Field>

        <Field label="Código postal">
          <TextInput value={form.cdPostal} onChange={(v) => set("cdPostal", v)} placeholder="1010" />
        </Field>
      </div>

      <Field label="Dirección línea 1 (máx. 50 caracteres)" error={errors.deDireccion1} required>
        <TextInput value={form.deDireccion1} onChange={(v) => set("deDireccion1", v)} placeholder="Edificio / Casa / Piso / Apartamento" />
        <div style={{ fontSize: "11px", color: "#80747b", marginTop: "3px" }}>{form.deDireccion1.length}/50 caracteres</div>
      </Field>

      <Field label="Dirección línea 2 (máx. 50 caracteres)">
        <TextInput value={form.deDireccion2} onChange={(v) => set("deDireccion2", v)} placeholder="Referencia adicional (opcional)" />
        <div style={{ fontSize: "11px", color: "#80747b", marginTop: "3px" }}>{form.deDireccion2.length}/50 caracteres</div>
      </Field>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
        <button onClick={onBack} style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "11px 20px", borderRadius: "4px", fontSize: "14px", fontWeight: 600, backgroundColor: "transparent", color: "#3A1335", border: "1.5px solid #3A1335", cursor: "pointer" }}>
          <ArrowLeftIcon /> Atrás
        </button>
        <button onClick={handleNext} style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "11px 24px", borderRadius: "4px", fontSize: "14px", fontWeight: 600, backgroundColor: "#3A1335", color: "#fff", border: "none", cursor: "pointer" }}>
          Continuar <ArrowRightIcon />
        </button>
      </div>
    </div>
  );
}

// ─── PersonaForm (shared for Asegurado + Tomador) ────────────────────────────

function PersonaForm({
  title, data, onChange, errors, indoles, paises,
}: {
  title: string;
  data: PersonaFormState;
  onChange: (k: keyof PersonaFormState, v: string) => void;
  errors: Partial<Record<keyof PersonaFormState, string>>;
  indoles?: CatalogItem[];
  paises?: CatalogItem[];
}) {
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState("");

  const lookup = async () => {
    setLookupError("");
    const check = checkClienteQuery(data.nacionalidad, data.cedulaRif);
    if (!check.ok) { setLookupError(check.reason); return; }
    setLookingUp(true);
    try {
      const r = await segurosCaracasClient.getCliente("", data.nacionalidad, data.cedulaRif);
      if ("cdError" in r && r.cdError === 0 && "cliente" in r) {
        const c = r.cliente;
        onChange("nombres", c.nombres);
        onChange("apellidosRazonSocial", c.apellidosRazonSocial);
        onChange("feNacimiento", c.feNacimiento);
        onChange("sexo", c.sexo);
        onChange("edoCivil", c.edoCivil);
      } else {
        setLookupError("No se encontró el cliente en Seguros Caracas.");
      }
    } catch {
      setLookupError("Error al consultar el cliente.");
    }
    setLookingUp(false);
  };

  const set = (k: keyof PersonaFormState, v: string) => onChange(k, sanitizePersonaField(k, v));

  const jurídica = data.nacionalidad === "J" || data.nacionalidad === "G";

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
        <UserIcon />
        <h3 style={{ fontFamily: "var(--font-display, Georgia, serif)", fontSize: "18px", fontWeight: 700, color: "#3A1335" }}>{title}</h3>
      </div>

      {/* Cédula lookup */}
      <div style={{ display: "grid", gridTemplateColumns: "120px 1fr auto", gap: "0 12px", alignItems: "flex-end", marginBottom: "20px" }}>
        <Field label="Nac." required>
          <SelectInput value={data.nacionalidad} onChange={(v) => onChange("nacionalidad", v)} options={[
            { value: "V", label: "V - Venezolano" },
            { value: "E", label: "E - Extranjero" },
            { value: "J", label: "J - Jurídico" },
            { value: "G", label: "G - Gubernamental" },
          ]} placeholder="—" />
        </Field>
        <Field label="Cédula / RIF" error={errors.cedulaRif} required>
          <TextInput value={data.cedulaRif} onChange={(v) => set("cedulaRif", v)} placeholder="12345678" />
        </Field>
        <div style={{ marginBottom: "20px" }}>
          <button onClick={lookup} disabled={lookingUp} style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            padding: "10px 16px", borderRadius: "4px", fontSize: "13px", fontWeight: 600,
            backgroundColor: "#C2A378", color: "#fff", border: "none",
            cursor: lookingUp ? "wait" : "pointer",
            whiteSpace: "nowrap",
          }}>
            <SearchIcon /> {lookingUp ? "Buscando…" : "Buscar cliente"}
          </button>
        </div>
      </div>
      {lookupError && <p style={{ fontSize: "12px", color: "#DC2626", marginTop: "-12px", marginBottom: "16px" }}>{lookupError}</p>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
        {!jurídica && (
          <Field label="Nombres" error={errors.nombres} required>
            <TextInput value={data.nombres} onChange={(v) => set("nombres", v)} placeholder="Juan Carlos" />
          </Field>
        )}
        <Field label={jurídica ? "Razón social" : "Apellidos"} error={errors.apellidosRazonSocial} required>
          <TextInput value={data.apellidosRazonSocial} onChange={(v) => set("apellidosRazonSocial", v)} placeholder={jurídica ? "Empresa, C.A." : "Pérez García"} />
        </Field>

        {!jurídica && (
          <>
            <Field label="Sexo" error={errors.sexo} required>
              <SelectInput value={data.sexo} onChange={(v) => onChange("sexo", v)} options={[{ value: "M", label: "Masculino" }, { value: "F", label: "Femenino" }]} placeholder="—" />
            </Field>
            <Field label="Estado civil" error={errors.edoCivil} required>
              <SelectInput value={data.edoCivil} onChange={(v) => onChange("edoCivil", v)} options={[
                { value: "S", label: "Soltero/a" }, { value: "C", label: "Casado/a" },
                { value: "D", label: "Divorciado/a" }, { value: "V", label: "Viudo/a" },
              ]} placeholder="—" />
            </Field>
            <Field label="Fecha de nacimiento (DD/MM/YYYY)" error={errors.feNacimiento} required>
              <TextInput value={data.feNacimiento} onChange={(v) => set("feNacimiento", v)} placeholder="15/03/1985" />
            </Field>
          </>
        )}

        <Field label="Correo electrónico" error={errors.email} required>
          <TextInput value={data.email} onChange={(v) => set("email", v)} type="email" placeholder="correo@empresa.com" />
        </Field>

        <Field label="Cód. área" error={errors.cdAreaTlf} required>
          <TextInput value={data.cdAreaTlf} onChange={(v) => set("cdAreaTlf", v)} placeholder="0212" />
        </Field>
        <Field label="Teléfono" error={errors.nuTlf} required>
          <TextInput value={data.nuTlf} onChange={(v) => set("nuTlf", v)} placeholder="7458878" />
        </Field>
      </div>

      <Field label="Dirección de residencia" error={errors.direccion} required>
        <TextInput value={data.direccion} onChange={(v) => set("direccion", v)} placeholder="Av. Principal, Edificio..." />
      </Field>
      <Field label="Profesión / Actividad económica">
        <TextInput value={data.profesion} onChange={(v) => set("profesion", v)} placeholder="Ingeniero, Médico, Comerciante..." />
      </Field>
    </div>
  );
}

// ─── Step 3: Asegurado ───────────────────────────────────────────────────────

function StepAsegurado({ onNext, onBack }: { onNext: (a: PersonaFormState) => void; onBack: () => void }) {
  const [form, setForm] = useState<PersonaFormState>({ ...PERSONA_EMPTY });
  const [errors, setErrors] = useState<Partial<Record<keyof PersonaFormState, string>>>({});

  const handleNext = () => {
    const errs = validatePersona(form);
    if (hasErrors(errs)) { setErrors(errs); return; }
    onNext(form);
  };

  const onChange = (k: keyof PersonaFormState, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  return (
    <div>
      <PersonaForm title="Datos del asegurado" data={form} onChange={onChange} errors={errors} />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "24px" }}>
        <button onClick={onBack} style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "11px 20px", borderRadius: "4px", fontSize: "14px", fontWeight: 600, backgroundColor: "transparent", color: "#3A1335", border: "1.5px solid #3A1335", cursor: "pointer" }}>
          <ArrowLeftIcon /> Atrás
        </button>
        <button onClick={handleNext} style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "11px 24px", borderRadius: "4px", fontSize: "14px", fontWeight: 600, backgroundColor: "#3A1335", color: "#fff", border: "none", cursor: "pointer" }}>
          Continuar <ArrowRightIcon />
        </button>
      </div>
    </div>
  );
}

// ─── Step 4: Tomador ─────────────────────────────────────────────────────────

function StepTomador({ asegurado, onNext, onBack }: { asegurado: PersonaFormState; onNext: (t: PersonaFormState, igual: boolean) => void; onBack: () => void }) {
  const [igual, setIgual] = useState(true);
  const [form, setForm] = useState<PersonaFormState>({ ...PERSONA_EMPTY });
  const [errors, setErrors] = useState<Partial<Record<keyof PersonaFormState, string>>>({});

  const handleNext = () => {
    if (igual) { onNext(asegurado, true); return; }
    const errs = validatePersona(form);
    if (hasErrors(errs)) { setErrors(errs); return; }
    onNext(form, false);
  };

  const onChange = (k: keyof PersonaFormState, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
        <UserIcon />
        <h2 style={{ fontFamily: "var(--font-display, Georgia, serif)", fontSize: "22px", fontWeight: 700, color: "#3A1335" }}>Tomador de la póliza</h2>
      </div>

      <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", padding: "16px", border: `2px solid ${igual ? "#3A1335" : "#d2c2cb"}`, borderRadius: "8px", marginBottom: "24px", backgroundColor: igual ? "#f5ebef" : "#fff", transition: "all 140ms ease" }}>
        <input type="checkbox" checked={igual} onChange={(e) => setIgual(e.target.checked)} style={{ width: "18px", height: "18px", accentColor: "#3A1335" }} />
        <span style={{ fontSize: "14px", fontWeight: 600, color: "#1f1a1d" }}>El tomador es el mismo que el asegurado</span>
      </label>

      {!igual && <PersonaForm title="Datos del tomador" data={form} onChange={onChange} errors={errors} />}

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "24px" }}>
        <button onClick={onBack} style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "11px 20px", borderRadius: "4px", fontSize: "14px", fontWeight: 600, backgroundColor: "transparent", color: "#3A1335", border: "1.5px solid #3A1335", cursor: "pointer" }}>
          <ArrowLeftIcon /> Atrás
        </button>
        <button onClick={handleNext} style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "11px 24px", borderRadius: "4px", fontSize: "14px", fontWeight: 600, backgroundColor: "#3A1335", color: "#fff", border: "none", cursor: "pointer" }}>
          Continuar <ArrowRightIcon />
        </button>
      </div>
    </div>
  );
}

// ─── Step 5: Confirmación y Emisión ─────────────────────────────────────────

function StepConfirmar({
  plan, freq, inmueble, asegurado, tomador, tomadorIgual, onBack,
}: {
  plan: Propuesta;
  freq: FrecuenciaPago;
  inmueble: HogarFormState["inmueble"];
  asegurado: PersonaFormState;
  tomador: PersonaFormState;
  tomadorIgual: boolean;
  onBack: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [poliza, setPoliza] = useState<{ cdRamo: number; cdSucursal: number; nuPoliza: number; nuRecibo: number } | null>(null);

  const emitir = async () => {
    setError(""); setSubmitting(true);
    const result = buildSuscribirPayload(
      { inmueble, asegurado, tomadorIgualAsegurado: tomadorIgual, tomador },
      { cdOpcion: plan.cdOpcion, cdMoneda: plan.cdMoneda, frPago: freq.cdFrPago }
    );
    if (!result.ok) {
      setError("Hay errores de validación. Por favor regrese y corrija los datos.");
      setSubmitting(false); return;
    }
    try {
      const res = await fetch("/api/emitir/hogar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.payload),
      });
      const data = await res.json();
      if (data.cdError === 0 && data.poliza) {
        setPoliza(data.poliza);
      } else {
        setError(data.deError ?? data.error ?? "Error al emitir la póliza. Verifique los datos.");
      }
    } catch {
      setError("Error de conexión al emitir la póliza.");
    }
    setSubmitting(false);
  };

  if (poliza) return (
    <div style={{ textAlign: "center", padding: "40px 0" }}>
      <div style={{ width: "72px", height: "72px", borderRadius: "50%", backgroundColor: "#f0fdf4", border: "2px solid #059669", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", color: "#059669" }}>
        <CheckCircleIcon />
      </div>
      <h2 style={{ fontFamily: "var(--font-display, Georgia, serif)", fontSize: "26px", fontWeight: 700, color: "#3A1335", marginBottom: "8px" }}>¡Póliza emitida exitosamente!</h2>
      <p style={{ fontSize: "14px", color: "#7a6d74", marginBottom: "32px" }}>La póliza HOGAR ha sido generada en Seguros Caracas.</p>

      <div style={{ display: "inline-grid", gridTemplateColumns: "1fr 1fr", gap: "16px", textAlign: "left", backgroundColor: "#f5ebef", borderRadius: "8px", padding: "24px", marginBottom: "32px" }}>
        {[
          ["Ramo", String(poliza.cdRamo)],
          ["Sucursal", String(poliza.cdSucursal)],
          ["N° de Póliza", String(poliza.nuPoliza)],
          ["N° de Recibo", String(poliza.nuRecibo)],
        ].map(([k, v]) => (
          <div key={k}>
            <div style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#7a6d74" }}>{k}</div>
            <div style={{ fontSize: "20px", fontWeight: 700, color: "#3A1335" }}>{v}</div>
          </div>
        ))}
      </div>

      <button onClick={() => window.location.reload()} style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "11px 24px", borderRadius: "4px", fontSize: "14px", fontWeight: 600, backgroundColor: "#3A1335", color: "#fff", border: "none", cursor: "pointer" }}>
        Emitir otra póliza
      </button>
    </div>
  );

  const SummaryRow = ({ label, value }: { label: string; value: string }) => (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f5ebef" }}>
      <span style={{ fontSize: "13px", color: "#7a6d74" }}>{label}</span>
      <span style={{ fontSize: "13px", fontWeight: 600, color: "#1f1a1d" }}>{value}</span>
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px", color: "#3A1335" }}>
        <ShieldIcon />
        <h2 style={{ fontFamily: "var(--font-display, Georgia, serif)", fontSize: "22px", fontWeight: 700, color: "#3A1335" }}>Confirme y emita</h2>
      </div>
      <p style={{ fontSize: "14px", color: "#7a6d74", marginBottom: "28px" }}>Revise los datos antes de emitir. Esta acción generará una póliza real en Seguros Caracas.</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "28px" }}>
        {/* Plan */}
        <div style={{ backgroundColor: "#f5ebef", borderRadius: "8px", padding: "20px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#C2A378", marginBottom: "12px" }}>Plan seleccionado</div>
          <SummaryRow label="Plan" value={plan.nmPropuesta} />
          <SummaryRow label="Frecuencia" value={freq.deFrPago} />
          <SummaryRow label="Prima" value={`${plan.cdMoneda} ${freq.mtPrima.toLocaleString("es-VE", { minimumFractionDigits: 2 })}`} />
        </div>

        {/* Inmueble */}
        <div style={{ backgroundColor: "#f5ebef", borderRadius: "8px", padding: "20px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#C2A378", marginBottom: "12px" }}>Inmueble</div>
          <SummaryRow label="Estado" value={inmueble.deEstado} />
          <SummaryRow label="Ciudad" value={inmueble.deCiudad} />
          <SummaryRow label="Sector" value={inmueble.deSector} />
          <SummaryRow label="Dirección" value={inmueble.deDireccion1} />
        </div>

        {/* Asegurado */}
        <div style={{ backgroundColor: "#f5ebef", borderRadius: "8px", padding: "20px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#C2A378", marginBottom: "12px" }}>Asegurado</div>
          <SummaryRow label="Nombre" value={`${asegurado.nombres} ${asegurado.apellidosRazonSocial}`} />
          <SummaryRow label="Cédula" value={`${asegurado.nacionalidad}-${asegurado.cedulaRif}`} />
          <SummaryRow label="Correo" value={asegurado.email} />
          <SummaryRow label="Teléfono" value={`${asegurado.cdAreaTlf}-${asegurado.nuTlf}`} />
        </div>

        {/* Tomador */}
        <div style={{ backgroundColor: "#f5ebef", borderRadius: "8px", padding: "20px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#C2A378", marginBottom: "12px" }}>Tomador</div>
          {tomadorIgual
            ? <div style={{ fontSize: "13px", color: "#7a6d74", fontStyle: "italic" }}>Mismo que el asegurado</div>
            : <>
                <SummaryRow label="Nombre" value={`${tomador.nombres} ${tomador.apellidosRazonSocial}`} />
                <SummaryRow label="Cédula" value={`${tomador.nacionalidad}-${tomador.cedulaRif}`} />
              </>
          }
        </div>
      </div>

      {error && (
        <div style={{ padding: "14px 18px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "6px", color: "#DC2626", fontSize: "14px", marginBottom: "20px" }}>
          {error}
        </div>
      )}

      <div style={{ padding: "14px 18px", backgroundColor: "#fffbeb", border: "1px solid #fde68a", borderRadius: "6px", fontSize: "13px", color: "#92400e", marginBottom: "24px" }}>
        ⚠ Al confirmar se emitirá una <strong>póliza real</strong> en Seguros Caracas. Esta acción no se puede deshacer.
      </div>

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <button onClick={onBack} disabled={submitting} style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "11px 20px", borderRadius: "4px", fontSize: "14px", fontWeight: 600, backgroundColor: "transparent", color: "#3A1335", border: "1.5px solid #3A1335", cursor: "pointer" }}>
          <ArrowLeftIcon /> Atrás
        </button>
        <button onClick={emitir} disabled={submitting} style={{
          display: "inline-flex", alignItems: "center", gap: "8px",
          padding: "11px 28px", borderRadius: "4px", fontSize: "14px", fontWeight: 700,
          backgroundColor: submitting ? "#7a6d74" : "#C2A378",
          color: "#fff", border: "none", cursor: submitting ? "wait" : "pointer",
          transition: "background-color 140ms ease",
        }}>
          {submitting ? "Emitiendo póliza…" : "Emitir póliza"} {!submitting && <ArrowRightIcon />}
        </button>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function EmitirPage() {
  const [step, setStep] = useState(1);
  const [plan, setPlan] = useState<Propuesta | null>(null);
  const [freq, setFreq] = useState<FrecuenciaPago | null>(null);
  const [inmueble, setInmueble] = useState<HogarFormState["inmueble"] | null>(null);
  const [asegurado, setAsegurado] = useState<PersonaFormState | null>(null);
  const [tomador, setTomador] = useState<PersonaFormState | null>(null);
  const [tomadorIgual, setTomadorIgual] = useState(true);

  const enabled = process.env.NEXT_PUBLIC_SC_ENABLED === "true";

  if (!enabled) return (
    <div style={{ minHeight: "100dvh", backgroundColor: "#fff7f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ maxWidth: "440px", textAlign: "center", padding: "40px 24px" }}>
        <div style={{ color: "#3A1335", marginBottom: "16px" }}><ShieldIcon /></div>
        <h1 style={{ fontFamily: "var(--font-display, Georgia, serif)", fontSize: "24px", fontWeight: 700, color: "#3A1335", marginBottom: "12px" }}>
          Módulo de emisión no disponible
        </h1>
        <p style={{ fontSize: "14px", color: "#7a6d74", lineHeight: "1.6" }}>
          La integración con Seguros Caracas está pendiente de habilitación. Una vez que SC confirme el acceso, este módulo estará activo.
        </p>
        <a href="/" style={{ display: "inline-block", marginTop: "24px", padding: "10px 24px", borderRadius: "4px", backgroundColor: "#3A1335", color: "#fff", fontSize: "14px", fontWeight: 600, textDecoration: "none" }}>
          Volver al inicio
        </a>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100dvh", backgroundColor: "#fff7f9" }}>
      {/* Nav */}
      <nav style={{ backgroundColor: "#3A1335", padding: "14px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <a href="/" style={{ textDecoration: "none", color: "#fff", fontWeight: 700, fontSize: "16px", fontFamily: "var(--font-display, Georgia, serif)" }}>
          Cabal Corretaje
        </a>
        <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Emisión · HOGAR · Seguros Caracas
        </span>
      </nav>

      <main style={{ maxWidth: "780px", margin: "0 auto", padding: "48px 24px" }}>
        <Stepper current={step} />

        <div style={{ backgroundColor: "#fff", borderRadius: "12px", padding: "36px", border: "1px solid #d2c2cb", boxShadow: "0 2px 8px rgba(58,19,53,0.06)" }}>
          {step === 1 && (
            <StepPlan onNext={(p, f) => { setPlan(p); setFreq(f); setStep(2); }} />
          )}
          {step === 2 && (
            <StepInmueble
              onNext={(i) => { setInmueble(i); setStep(3); }}
              onBack={() => setStep(1)}
            />
          )}
          {step === 3 && (
            <StepAsegurado
              onNext={(a) => { setAsegurado(a); setStep(4); }}
              onBack={() => setStep(2)}
            />
          )}
          {step === 4 && asegurado && (
            <StepTomador
              asegurado={asegurado}
              onNext={(t, igual) => { setTomador(t); setTomadorIgual(igual); setStep(5); }}
              onBack={() => setStep(3)}
            />
          )}
          {step === 5 && plan && freq && inmueble && asegurado && tomador && (
            <StepConfirmar
              plan={plan} freq={freq} inmueble={inmueble}
              asegurado={asegurado} tomador={tomador} tomadorIgual={tomadorIgual}
              onBack={() => setStep(4)}
            />
          )}
        </div>
      </main>

      <style>{`
        select option { color: #1f1a1d; }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
}
