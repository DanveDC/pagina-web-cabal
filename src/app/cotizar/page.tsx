"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type Ramo = "automovil" | "salud" | "hogar" | "patrimoniales";
type Step = 1 | 2 | 3 | "results";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const RAMOS: { id: Ramo; label: string; desc: string; color: string; icon: string }[] = [
  { id: "automovil",     label: "Automóvil",     desc: "Flota vehicular e individuales",    color: "#5B3AF5", icon: "🚗" },
  { id: "salud",         label: "Salud",          desc: "HCM colectivo para tu equipo",      color: "#059669", icon: "❤️" },
  { id: "hogar",         label: "Hogar",          desc: "Residenciales y comerciales",       color: "#D97706", icon: "🏠" },
  { id: "patrimoniales", label: "Patrimoniales",  desc: "Bienes y responsabilidad civil",    color: "#0284C7", icon: "🏢" },
];

const STEPS = ["Empresa", "Ramo", "Detalles"];

const OFERTAS = [
  {
    nombre: "Seguros Caracas",    siglas: "SC", color: "#3A1335",
    prima_anual: 1_240, prima_mensual: 103, tag: "Recomendada", score: 94,
    coberturas: [
      { label: "Suma asegurada",         valor: "[ Placeholder: $XX,XXX ]" },
      { label: "Deducible",              valor: "[ Placeholder: X% ]"      },
      { label: "Red clínica",            valor: "[ Placeholder: XXX clínicas ]" },
      { label: "Cobertura internacional",valor: "Incluida"                  },
    ],
    destacado: true,
  },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const fadeSlide = {
  initial: { opacity: 0, x: 16 },
  animate: { opacity: 1, x: 0 },
  exit:    { opacity: 0, x: -16 },
  transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] as number[] },
};

const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -10 },
  transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as number[] },
};

// ─── SMALL COMPONENTS ─────────────────────────────────────────────────────────

function StepDot({ n, active, done }: { n: number; active: boolean; done: boolean }) {
  const bg    = done ? "#3A1335" : active ? "rgba(58,19,53,0.10)" : "rgba(58,19,53,0.07)";
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

function Field({ label, type = "text", placeholder = "", hint = "", suffix = "" }: {
  label: string; type?: string; placeholder?: string; hint?: string; suffix?: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{
        fontSize: 11, fontWeight: 600, color: "#3A1335",
        letterSpacing: "0.10em", textTransform: "uppercase" as const,
      }}>{label}</label>
      <div style={{ position: "relative" }}>
        <input
          type={type}
          placeholder={placeholder || label}
          style={{
            width: "100%",
            padding: suffix ? "10px 40px 10px 0" : "10px 0",
            background: "transparent",
            border: "none",
            borderBottom: "1.5px solid #d2c2cb",
            color: "#1f1a1d",
            fontSize: 14, outline: "none",
            transition: "border-color 200ms ease",
            boxSizing: "border-box" as const,
          }}
          onFocus={e  => { e.currentTarget.style.borderBottomColor = "#3A1335"; e.currentTarget.style.borderBottomWidth = "2px"; }}
          onBlur={e   => { e.currentTarget.style.borderBottomColor = "#d2c2cb"; e.currentTarget.style.borderBottomWidth = "1.5px"; }}
        />
        {suffix && (
          <span style={{
            position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)",
            fontSize: 11, color: "#80747b", fontWeight: 600, pointerEvents: "none",
          }}>{suffix}</span>
        )}
      </div>
      {hint && <p style={{ fontSize: 11, color: "#80747b", marginTop: 2 }}>{hint}</p>}
    </div>
  );
}

function Select({ label, options, hint = "" }: {
  label: string;
  options: { value: string; label: string }[];
  hint?: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{
        fontSize: 11, fontWeight: 600, color: "#3A1335",
        letterSpacing: "0.10em", textTransform: "uppercase" as const,
      }}>{label}</label>
      <select style={{
        width: "100%", padding: "10px 0",
        background: "transparent",
        border: "none",
        borderBottom: "1.5px solid #d2c2cb",
        color: "#1f1a1d",
        fontSize: 14, outline: "none", appearance: "none" as const,
        boxSizing: "border-box" as const,
        cursor: "pointer",
      }}
        onFocus={e => { e.currentTarget.style.borderBottomColor = "#3A1335"; e.currentTarget.style.borderBottomWidth = "2px"; }}
        onBlur={e  => { e.currentTarget.style.borderBottomColor = "#d2c2cb"; e.currentTarget.style.borderBottomWidth = "1.5px"; }}
      >
        <option value="">Seleccionar...</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {hint && <p style={{ fontSize: 11, color: "#80747b", marginTop: 2 }}>{hint}</p>}
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
        width: "100%", padding: "12px 20px",
        borderRadius: 4, border: "none",
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
    <button
      onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        background: "none", border: "none", cursor: "pointer",
        fontSize: 13, color: "#4A464A", marginBottom: 20, padding: 0,
      }}
    >
      ← Atrás
    </button>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function CotizarPage() {
  const [step, setStep]   = useState<Step>(1);
  const [ramo, setRamo]   = useState<Ramo | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCalcular = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 2200));
    setLoading(false);
    setStep("results");
  };

  const resetForm = () => { setStep(1); setRamo(null); };

  const currentStepNum = step === "results" ? 3 : (step as number);

  return (
    <div style={{ minHeight: "100dvh", backgroundColor: "#fff7f9", fontFamily: "var(--font-inter, var(--font-body, system-ui))" }}>

      {/* ── HEADER ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        height: 56, display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 24px",
        backgroundColor: "rgba(255,255,255,0.92)",
        borderBottom: "1px solid rgba(58,19,53,0.09)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}>
        <a href="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
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
        </a>

        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <div style={{
            width: 7, height: 7, borderRadius: "50%",
            backgroundColor: "#059669",
            animation: "pulse 2s ease-in-out infinite",
          }} />
          <span style={{ fontSize: 12, color: "#4A464A", fontWeight: 500 }}>Sistema operativo</span>
        </div>
      </header>

      {/* ── CONTENIDO ── */}
      <main style={{ maxWidth: 640, margin: "0 auto", padding: "40px 24px 80px" }}>

        {/* Steps */}
        {step !== "results" && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 36 }}>
            {STEPS.map((label, i) => {
              const n    = i + 1;
              const done = currentStepNum > n;
              const active = currentStepNum === n;
              return (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <StepDot n={n} active={active} done={done} />
                    <span style={{
                      fontSize: 12, fontWeight: 500,
                      color: active ? "#3A1335" : done ? "#3A1335" : "#7A7A8A",
                      display: "none",
                    }}
                      className="sm:inline"
                    >{label}</span>
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
                <Field label="Razón Social" />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Field label="RIF" hint="Ej: J-12345678-9" />
                  <Field label="N° de empleados" type="number" />
                </div>
                <Select
                  label="Sector industrial"
                  options={[
                    { value: "manufactura",   label: "Manufactura"   },
                    { value: "servicios",     label: "Servicios"     },
                    { value: "comercio",      label: "Comercio"      },
                    { value: "tecnologia",    label: "Tecnología"    },
                    { value: "construccion",  label: "Construcción"  },
                    { value: "salud",         label: "Salud"         },
                    { value: "educacion",     label: "Educación"     },
                    { value: "otro",          label: "Otro"          },
                  ]}
                  hint="Clasifica el giro principal de tu empresa"
                />
                <Field label="Facturación anual estimada" type="number" suffix="USD" />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Field label="Email de contacto" type="email" />
                  <Field label="Teléfono" type="tel" hint="+58..." />
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
                {ramo === "automovil" && <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <Field label="Marca" />
                    <Field label="Modelo" />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <Field label="Año" type="number" />
                    <Field label="Valor asegurado" type="number" suffix="USD" />
                  </div>
                  <Select label="Uso del vehículo" options={[
                    { value: "particular", label: "Particular" },
                    { value: "comercial",  label: "Comercial"  },
                    { value: "carga",      label: "Carga"      },
                  ]} />
                  <Field label="N° de vehículos (si es flota)" type="number" hint="Dejá en blanco si es un solo vehículo" />
                </>}

                {ramo === "salud" && <>
                  <Field label="N° de asegurados" type="number" />
                  <Field label="Edad promedio del grupo" type="number" suffix="años" />
                  <Select label="Cobertura deseada" options={[
                    { value: "basica",     label: "Básica"     },
                    { value: "intermedia", label: "Intermedia" },
                    { value: "premium",    label: "Premium"    },
                  ]} />
                </>}

                {(ramo === "hogar" || ramo === "patrimoniales") && <>
                  <Field label="Tipo de riesgo" />
                  <Field label="Valor de bienes" type="number" suffix="USD" />
                  <Field label="Dirección del riesgo" />
                  <Field label="Metros cuadrados" type="number" suffix="m²" />
                </>}
              </div>

              <PrimaryBtn onClick={handleCalcular}>
                ✦ Calcular cotizaciones
              </PrimaryBtn>
            </motion.div>
          )}

          {/* ─── LOADING ─── */}
          {loading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
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
                  { label: "Conectando con aseguradoras", delay: "0ms"   },
                  { label: "Calculando primas",           delay: "600ms" },
                  { label: "Comparando coberturas",       delay: "1200ms" },
                ].map(s => (
                  <div key={s.label} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    animation: `fadeInLeft 0.3s ease both`,
                    animationDelay: s.delay,
                  }}>
                    <div style={{
                      width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
                      backgroundColor: "#5A1D4F",
                      animation: "pulse 1.5s ease-in-out infinite",
                    }} />
                    <span style={{ fontSize: 13, color: "#4A464A" }}>{s.label}</span>
                  </div>
                ))}
              </div>

              {/* Skeleton cards */}
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
                        <div style={{ width: 90, height: 10, borderRadius: 4, backgroundColor: "rgba(58,19,53,0.04)" }} />
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
                        <div style={{ width: "60%", height: 9, borderRadius: 3, backgroundColor: "rgba(58,19,53,0.04)", marginBottom: 4 }} />
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

              {/* Header */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.4px", color: "#3A1335", marginBottom: 4 }}>
                    Comparativa de cotizaciones
                  </h2>
                  <p style={{ fontSize: 12.5, color: "#4A464A" }}>
                    1 aseguradora · válida 48 h
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 99,
                    backgroundColor: "rgba(217,119,6,0.10)", color: "#B45309",
                    border: "1px solid rgba(217,119,6,0.22)",
                  }}>
                    ⚠ Datos de simulación
                  </span>
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

              {/* Tarjetas */}
              {OFERTAS.map((oferta, i) => (
                <motion.div
                  key={oferta.nombre}
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
                  {/* Barra de color */}
                  <div style={{ height: 3, backgroundColor: oferta.color }} />

                  <div style={{ padding: "20px 20px 18px" }}>
                    {/* Cabecera */}
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
                            }}>
                              {oferta.tag}
                            </span>
                          </div>
                          <p style={{ fontSize: 12, color: "#4A464A", marginTop: 2 }}>Póliza anual · 1 año vigencia</p>
                        </div>
                      </div>

                      {/* Precio */}
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <p style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-1px", color: "#3A1335", lineHeight: 1 }}>
                          ${oferta.prima_anual.toLocaleString()}
                        </p>
                        <p style={{ fontSize: 11, color: "#7A7A8A", marginTop: 1 }}>USD / año</p>
                        <p style={{ fontSize: 12, color: oferta.color, fontWeight: 700, marginTop: 2 }}>
                          ~${oferta.prima_mensual} / mes
                        </p>
                      </div>
                    </div>

                    {/* Score bar */}
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

                    {/* Separador */}
                    <div style={{ height: 1, backgroundColor: "rgba(58,19,53,0.08)", marginBottom: 14 }} />

                    {/* Coberturas */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px", marginBottom: 16 }}>
                      {oferta.coberturas.map(c => (
                        <div key={c.label}>
                          <p style={{ fontSize: 10, fontWeight: 600, color: "#7A7A8A", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>
                            {c.label}
                          </p>
                          <p style={{ fontSize: 12.5, color: "#4A4560", marginTop: 2, fontWeight: c.valor.startsWith("[") ? 400 : 500 }}>
                            {c.valor}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* CTA */}
                    <button
                      style={{
                        width: "100%", padding: "11px 16px",
                        borderRadius: 4,
                        backgroundColor: oferta.destacado ? "#C2A378" : "transparent",
                        color: oferta.destacado ? "#fff" : "#3A1335",
                        border: oferta.destacado ? "none" : "1.5px solid #d2c2cb",
                        fontSize: 13.5, fontWeight: 600, cursor: "pointer",
                        transition: "background-color 140ms ease, border-color 140ms ease, transform 140ms ease",
                      }}
                      onMouseEnter={e => {
                        if (oferta.destacado) { e.currentTarget.style.backgroundColor = "#B8956A"; }
                        else { e.currentTarget.style.borderColor = "#3A1335"; }
                        e.currentTarget.style.transform = "translateY(-1px)";
                      }}
                      onMouseLeave={e => {
                        if (oferta.destacado) { e.currentTarget.style.backgroundColor = "#C2A378"; }
                        else { e.currentTarget.style.borderColor = "#d2c2cb"; }
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      Solicitar esta póliza →
                    </button>
                  </div>
                </motion.div>
              ))}

              <p style={{ textAlign: "center", fontSize: 11.5, color: "#7A7A8A", paddingTop: 4, lineHeight: 1.6 }}>
                Los precios y coberturas son simulaciones de referencia.
                Los valores reales serán provistos por las aseguradoras al integrar las APIs.
              </p>
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
