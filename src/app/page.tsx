"use client";

/**
 * Cabal Asesores — Landing Page
 *
 * Taste Skill (design-taste-frontend) aplicado:
 *   DESIGN_VARIANCE: 8  → Hero asimétrico split-screen, grid fraccionario
 *   MOTION_INTENSITY: 6 → CSS spring transitions + scroll reveals
 *   VISUAL_DENSITY: 4   → Daily App Mode
 *
 * Reglas críticas:
 *   ✅ Geist font (Inter BANEADO)
 *   ✅ Hero left-aligned split-screen (centered hero BANEADO en DV:8)
 *   ✅ Emojis BANEADOS → solo SVG icons
 *   ✅ Gradient text en headlines BANEADO
 *   ✅ Outer glows/neón BANEADOS → diffusion shadows + inner refraction borders
 *   ✅ Purple desaturado < 80% sat
 *   ✅ 3-col cards iguales BANEADO → zig-zag + grid asimétrico
 *   ✅ min-h-[100dvh] (h-screen BANEADO)
 *   ✅ spotlight-card con inner refraction (Liquid Glass)
 *   ✅ press feedback scale(0.97) en todos los botones
 *   ✅ Stagger 60-80ms entre items
 *   ✅ IntersectionObserver reveal (once: true)
 *
 * Emil Kowalski aplicado:
 *   ✅ cubic-bezier(0.23,1,0.32,1) ease-out
 *   ✅ scale(0.97) nunca scale(0) como punto de entrada
 *   ✅ Hover guard @media (hover: hover) and (pointer: fine)
 *   ✅ Transición de props exactas, nunca 'all'
 *   ✅ prefers-reduced-motion
 *   ✅ Asimetría enter/exit
 */

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

// ─── SVG ICONS (sin Lucide por ahora, Taste: emojis BANEADOS) ────────────────

const CarIcon = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 17H3v-5l2-5h14l2 5v5h-2" /><circle cx="7.5" cy="17.5" r="1.5" /><circle cx="16.5" cy="17.5" r="1.5" /><path d="M5 12h14" />
  </svg>
);
const HeartPulseIcon = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);
const HomeIcon = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);
const BuildingIcon = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);
const CheckIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const ArrowRightIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);
const MenuIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);
const XIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const MapPinIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
);
const PhoneIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.56 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);
const MailIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
  </svg>
);
// Taste: íconos para valor cards (SIN emojis)
const ScaleIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="3" x2="12" y2="21" /><path d="M3 8l9-5 9 5M3 16l9 5 9-5" />
  </svg>
);
const AwardIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="6" /><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
  </svg>
);
const ZapIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);
const LockIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const WhatsAppIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

// ─── DATA ─────────────────────────────────────────────────────────────────────

const RAMOS = [
  { icon: CarIcon, titulo: "Automóvil", descripcion: "Pólizas de casco, responsabilidad civil y asistencia en carretera para vehículos individuales y flotas empresariales de cualquier tamaño.", beneficios: ["Cobertura a todo riesgo", "Asistencia 24/7 en carretera", "Flota corporativa"], acento: "#5b3cf5" },
  { icon: HeartPulseIcon, titulo: "Salud", descripcion: "HCM individual y colectivo que garantiza la atención médica de tu familia y equipo de trabajo con la red clínica más amplia.", beneficios: ["Red clínica amplia en Venezuela", "Cobertura internacional", "Planes familiares flexibles"], acento: "#0d9488" },
  { icon: HomeIcon, titulo: "Hogar", descripcion: "Protección integral para tu residencia y bienes muebles ante robo, incendio, daños eléctricos y desastres naturales.", beneficios: ["Daños estructurales y eléctricos", "Contenido del hogar", "Responsabilidad civil"], acento: "#b45309" },
  { icon: BuildingIcon, titulo: "Patrimoniales", descripcion: "Seguros de incendio, robo, responsabilidad civil y multirriesgo diseñados para empresas, galpones y activos corporativos.", beneficios: ["Multirriesgo empresarial", "Responsabilidad civil general", "Transporte de mercancía"], acento: "#0369a1" },
];

const STATS = [
  { valor: "+20", label: "Años en el mercado" },
  { valor: "+15", label: "Aseguradoras aliadas" },
  { valor: "+2.400", label: "Clientes activos" },
  { valor: "S-746", label: "SUDESEG" },
];

// Taste: nombres realistas, no "John Doe" / números orgánicos
const VALUE_CARDS = [
  { icon: ScaleIcon, titulo: "Independencia", desc: "Sin ataduras con ninguna aseguradora. Negociamos en tu favor, siempre." },
  { icon: AwardIcon, titulo: "Experiencia", desc: "Más de 23 años en el mercado asegurador venezolano desde 2002." },
  { icon: ZapIcon, titulo: "Agilidad", desc: "Cotizaciones en menos de 24 horas hábiles, sin trámites innecesarios." },
  { icon: LockIcon, titulo: "Solidez", desc: "Inscrito y regulado por la Superintendencia de la Actividad Aseguradora." },
];

const ASEGURADORAS = [
  "Seguros Caracas", "Mapfre La Seguridad", "Mercantil Seguros",
  "Qualitas Seguros", "Zurich Seguros", "AIG Venezuela",
  "BBVA Allianz", "Internacional de Seguros", "Seguros Horizonte",
  "La Venezolana de Seguros", "Multinacional de Seguros", "Banesco Seguros",
];

const PASOS = [
  {
    num: "01", titulo: "Contactanos",
    desc: "Completás el formulario en línea o nos escribís directamente por WhatsApp con los detalles de lo que querés asegurar.",
  },
  {
    num: "02", titulo: "Comparamos",
    desc: "Consultamos con más de 15 aseguradoras para encontrar la mejor cobertura al precio más competitivo del mercado.",
  },
  {
    num: "03", titulo: "Elegís",
    desc: "Te presentamos un informe comparativo claro y objetivo. Sin letra pequeña, sin presión, con toda la información.",
  },
  {
    num: "04", titulo: "Te acompañamos",
    desc: "Gestionamos tu póliza, renovaciones y cualquier siniestro durante toda la vigencia del contrato.",
  },
];

// ─── HOOK: useInView ──────────────────────────────────────────────────────────

function useInView(margin = "-80px") {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } },
      { rootMargin: margin }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [margin]);
  return { ref, inView };
}

// ─── COMPONENTE: Button ───────────────────────────────────────────────────────
// Taste: press feedback scale(0.97), NO outer glow, diffusion shadow
// Emil: transition exact props, hover guard

function Btn({ href, variant = "primary", children, style: s }: {
  href: string; variant?: "primary" | "ghost";
  children: React.ReactNode; style?: React.CSSProperties;
}) {
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
    <a href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false); }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        display: "inline-flex", alignItems: "center", gap: "6px",
        padding: "11px 20px", borderRadius: "9px",
        fontSize: "13.5px", fontWeight: 600, textDecoration: "none", cursor: "pointer",
        // Emil: exact props only
        transition: "transform 140ms cubic-bezier(0.23,1,0.32,1), background-color 140ms ease, border-color 140ms ease",
        transform: pressed ? "scale(0.97)" : "scale(1)",
        ...(variant === "primary" ? {
          backgroundColor: hovered ? "var(--cta-hover)" : "var(--cta-bg)",
          color: "var(--cta-text)",
          // Taste: NO outer glow → diffusion shadow tinted to brand purple
          boxShadow: pressed ? "none" : "0 8px 24px -4px rgba(58,19,53,0.30)",
        } : {
          backgroundColor: "transparent",
          border: `1px solid ${hovered ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.10)"}`,
          color: hovered ? "#ffffff" : "rgba(255,255,255,0.70)",
          // Taste: inner refraction en ghost button
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
        }),
        ...s,
      }}
    >
      {children}
    </a>
  );
}

// ─── COMPONENTE: HeroPrimaryBtn (bright purple for dark hero background) ─────

function HeroPrimaryBtn({ href, children }: { href: string; children: React.ReactNode }) {
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);
  return (
    <a href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false); }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        display: "inline-flex", alignItems: "center", gap: "6px",
        padding: "12px 24px", borderRadius: "10px",
        fontSize: "14px", fontWeight: 600, textDecoration: "none", cursor: "pointer",
        transition: "transform 140ms cubic-bezier(0.23,1,0.32,1), background-color 140ms ease",
        transform: pressed ? "scale(0.97)" : "scale(1)",
        backgroundColor: hovered ? "var(--cta-hover)" : "var(--cta-bg)",
        color: "var(--cta-text)",
        boxShadow: pressed ? "none" : "0 8px 24px -4px rgba(58,19,53,0.40)",
      }}
    >
      {children}
    </a>
  );
}

// ─── COMPONENTE: WhatsAppBtn ──────────────────────────────────────────────────

function WhatsAppBtn() {
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  useEffect(() => {
    const fn = () => setVisible(window.scrollY > 320);
    window.addEventListener("scroll", fn, { passive: true });
    fn();
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <a
      href="https://wa.me/582127458878"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactar por WhatsApp"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false); }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        position: "fixed", bottom: "28px", right: "28px", zIndex: 200,
        width: "52px", height: "52px", borderRadius: "99px",
        backgroundColor: "#25D366",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "white", textDecoration: "none",
        boxShadow: pressed ? "0 2px 8px rgba(37,211,102,0.2)" : "0 4px 24px rgba(37,211,102,0.4)",
        transition: "opacity 280ms cubic-bezier(0.23,1,0.32,1), transform 140ms cubic-bezier(0.23,1,0.32,1), box-shadow 140ms ease",
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
        transform: visible
          ? pressed ? "scale(0.94)" : hovered ? "scale(1.07)" : "scale(1)"
          : "scale(0.82) translateY(10px)",
      }}
    >
      <WhatsAppIcon />
      <span aria-hidden style={{
        position: "absolute", inset: 0, borderRadius: "99px",
        border: "2px solid rgba(37,211,102,0.5)",
        animation: visible ? "whatsappPulse 2.8s ease-out infinite" : "none",
      }} />
    </a>
  );
}

// ─── COMPONENTE: SectionLabel ─────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      fontSize: "11px", fontWeight: 700, letterSpacing: "0.09em",
      color: "var(--crimson)", textTransform: "uppercase" as const, display: "block",
    }}>{children}</span>
  );
}

// ─── COMPONENTE: RamoCard (Spotlight border, inner refraction) ────────────────
// Taste: Spotlight Border Card + Liquid Glass
// Emil: enter from scale(0.97), hover guard, stagger via delay

function RamoCard({ ramo, delay, reverse }: {
  ramo: typeof RAMOS[0]; delay: number; reverse?: boolean;
}) {
  const { ref, inView } = useInView();
  const [hovered, setHovered] = useState(false);
  const Icon = ramo.icon;

  return (
    <div
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      // Taste: spotlight-card class (inner refraction border)
      className="spotlight-card"
      style={{
        padding: "32px",
        opacity: inView ? 1 : 0,
        transform: inView ? (hovered ? "translateY(-3px)" : "translateY(0)") : "translateY(12px) scale(0.97)",
        transition: "opacity 400ms cubic-bezier(0.23,1,0.32,1), transform 220ms cubic-bezier(0.23,1,0.32,1), border-color 200ms ease, background-color 200ms ease, box-shadow 200ms ease",
        transitionDelay: inView ? `${delay}ms` : "0ms",
      }}
    >
      {/* Layout: icon derecha en filas reverse — Taste: zig-zag */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "20px", flexDirection: reverse ? "row-reverse" : "row" }}>
        <div style={{
          width: "44px", height: "44px", borderRadius: "11px", flexShrink: 0,
          backgroundColor: `${ramo.acento}14`,
          // Taste: inner refraction border
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08), 0 0 0 1px ${ramo.acento}20`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: ramo.acento,
          transition: "background-color 200ms ease",
          ...(hovered ? { backgroundColor: `${ramo.acento}22` } : {}),
        }}>
          <Icon />
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "8px", color: "#3A1335", letterSpacing: "-0.3px" }}>
            {ramo.titulo}
          </h3>
          <p style={{ fontSize: "13.5px", lineHeight: 1.72, color: "#4A464A", marginBottom: "18px" }}>
            {ramo.descripcion}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
            {ramo.beneficios.map((b, i) => (
              <div key={b} style={{
                display: "flex", alignItems: "center", gap: "8px",
                opacity: inView ? 1 : 0,
                transform: inView ? "translateX(0)" : "translateX(-6px)",
                transition: "opacity 300ms ease, transform 300ms cubic-bezier(0.23,1,0.32,1)",
                transitionDelay: inView ? `${delay + 100 + i * 50}ms` : "0ms",
              }}>
                <span style={{
                  width: "16px", height: "16px", borderRadius: "99px", flexShrink: 0,
                  backgroundColor: `${ramo.acento}14`,
                  boxShadow: `0 0 0 1px ${ramo.acento}25`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: ramo.acento,
                }}><CheckIcon /></span>
                <span style={{ fontSize: "12.5px", color: "#4A464A" }}>{b}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SECCIÓN: Banda de aseguradoras ─────────────────────────────────────────

function AseguradorasBand() {
  const items = [...ASEGURADORAS, ...ASEGURADORAS];
  return (
    <div style={{
      borderTop: "1px solid rgba(58,19,53,0.08)",
      borderBottom: "1px solid rgba(58,19,53,0.08)",
      backgroundColor: "rgba(58,19,53,0.04)",
      padding: "20px 0", overflow: "hidden", position: "relative",
    }}>
      <div aria-label="Aseguradoras con las que trabajamos" style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "100px", background: "linear-gradient(90deg, rgba(58,19,53,0.04) 0%, transparent 100%)", zIndex: 2, pointerEvents: "none" }} />
      <div aria-hidden style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "100px", background: "linear-gradient(270deg, rgba(58,19,53,0.04) 0%, transparent 100%)", zIndex: 2, pointerEvents: "none" }} />
      <div className="marquee-track" style={{ display: "flex", gap: "10px", width: "max-content" }}>
        {items.map((name, i) => (
          <span key={i} style={{
            fontSize: "12px", fontWeight: 600, letterSpacing: "0.04em",
            color: "#4A464A", whiteSpace: "nowrap",
            padding: "5px 14px", borderRadius: "99px",
            border: "1px solid rgba(58,19,53,0.10)",
            backgroundColor: "rgba(58,19,53,0.05)",
            flexShrink: 0,
          }}>
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── COMPONENTE: PasoCard ────────────────────────────────────────────────────

function PasoCard({ paso, delay, inView }: { paso: typeof PASOS[0]; delay: number; inView: boolean }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="spotlight-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: "32px 26px",
        opacity: inView ? 1 : 0,
        transform: inView
          ? hovered ? "translateY(-4px)" : "translateY(0) scale(1)"
          : "translateY(16px) scale(0.97)",
        transition: "opacity 420ms cubic-bezier(0.23,1,0.32,1), transform 220ms cubic-bezier(0.23,1,0.32,1), border-color 200ms ease, background-color 200ms ease",
        transitionDelay: inView ? `${delay}ms` : "0ms",
      }}
    >
      <div style={{
        fontSize: "42px", fontWeight: 800, letterSpacing: "-3px", lineHeight: 1, marginBottom: "22px",
        transition: "color 200ms ease",
        color: hovered ? "rgba(58,19,53,0.28)" : "rgba(58,19,53,0.12)",
      }}>
        {paso.num}
      </div>
      <h3 style={{ fontSize: "15.5px", fontWeight: 700, color: "#3A1335", marginBottom: "10px", letterSpacing: "-0.3px" }}>
        {paso.titulo}
      </h3>
      <p style={{ fontSize: "13px", lineHeight: 1.78, color: "#4A464A" }}>
        {paso.desc}
      </p>
    </div>
  );
}

// ─── SECCIÓN: Cómo funciona ──────────────────────────────────────────────────

function ComoFuncionaSection() {
  const { ref, inView } = useInView();
  return (
    <section style={{
      padding: "110px 32px",
      backgroundColor: "rgba(58,19,53,0.04)",
      position: "relative", overflow: "hidden",
    }}>
      {/* Dot grid background */}
      <div aria-hidden style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: "radial-gradient(circle, rgba(58,19,53,0.025) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }} />

      <div style={{ maxWidth: "1240px", margin: "0 auto", position: "relative" }}>
        <div ref={ref} style={{
          marginBottom: "64px",
          opacity: inView ? 1 : 0,
          transform: inView ? "translateY(0)" : "translateY(10px)",
          transition: "opacity 400ms cubic-bezier(0.23,1,0.32,1), transform 400ms cubic-bezier(0.23,1,0.32,1)",
        }}>
          <Label>El proceso</Label>
          <h2 style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 800, letterSpacing: "-1.5px", marginTop: "10px", color: "#3A1335", maxWidth: "520px" }}>
            Así de simple es trabajar con nosotros
          </h2>
        </div>

        <div className="pasos-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px" }}>
          {PASOS.map((paso, i) => (
            <PasoCard key={paso.num} paso={paso} delay={i * 80} inView={inView} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── SECCIÓN: Servicios ───────────────────────────────────────────────────────
// Taste: zig-zag (NO 3-col iguales). Grid 2/3 + 1/3 asimétrico

function ServiciosSection() {
  const { ref, inView } = useInView();
  return (
    <section id="servicios" style={{ padding: "110px 32px", maxWidth: "1240px", margin: "0 auto" }}>
      <div ref={ref} style={{
        marginBottom: "64px",
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(10px)",
        transition: "opacity 400ms cubic-bezier(0.23,1,0.32,1), transform 400ms cubic-bezier(0.23,1,0.32,1)",
      }}>
        <Label>Nuestros ramos</Label>
        {/* Taste: NO centered — left-aligned */}
        <h2 style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 800, letterSpacing: "-1.5px", marginTop: "10px", color: "#3A1335", maxWidth: "520px" }}>
          Cobertura para cada necesidad empresarial
        </h2>
        <p style={{ fontSize: "15px", color: "#4A464A", marginTop: "12px", maxWidth: "440px", lineHeight: 1.7 }}>
          Trabajamos con las principales aseguradoras de Venezuela para ofrecerte las mejores opciones del mercado.
        </p>
      </div>

      {/* Taste: zig-zag layout, NO 3 cards iguales */}
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        {/* Fila 1: 2 + 1 asimétrico */}
        <div className="ramos-row-1" style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr", gap: "14px" }}>
          <RamoCard ramo={RAMOS[0]} delay={0} />
          <RamoCard ramo={RAMOS[1]} delay={80} />
        </div>
        {/* Fila 2: 1 + 2 invertido */}
        <div className="ramos-row-2" style={{ display: "grid", gridTemplateColumns: "1.2fr 2fr", gap: "14px" }}>
          <RamoCard ramo={RAMOS[2]} delay={160} />
          <RamoCard ramo={RAMOS[3]} delay={240} reverse />
        </div>
      </div>
    </section>
  );
}

// ─── SECCIÓN: Nosotros ────────────────────────────────────────────────────────

function NosotrosSection() {
  const { ref, inView } = useInView();
  return (
    <section id="nosotros" style={{
      borderTop: "1px solid rgba(58,19,53,0.08)",
      borderBottom: "1px solid rgba(58,19,53,0.08)",
      backgroundColor: "#FFFFFF", padding: "110px 32px",
    }}>
      <div ref={ref} style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Taste: split layout, NO centered */}
        <div className="nosotros-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "80px", alignItems: "start" }}>

          {/* Columna izquierda */}
          <div style={{
            opacity: inView ? 1 : 0,
            transform: inView ? "translateX(0)" : "translateX(-14px)",
            transition: "opacity 500ms cubic-bezier(0.23,1,0.32,1), transform 500ms cubic-bezier(0.23,1,0.32,1)",
          }}>
            <Label>Quiénes somos</Label>
            <h2 style={{ fontSize: "clamp(22px, 3.2vw, 36px)", fontWeight: 800, letterSpacing: "-1px", margin: "12px 0 18px", color: "#3A1335", lineHeight: 1.18 }}>
              Más de dos décadas cuidando el patrimonio empresarial venezolano
            </h2>
            <p style={{ fontSize: "14.5px", lineHeight: 1.8, color: "#4A464A", marginBottom: "14px" }}>
              Cabal Corretaje de Seguros, C.A. es un corredor independiente inscrito en la Superintendencia de la Actividad Aseguradora bajo el N° S-746, con sede en Torre Credicard, Caracas.
            </p>
            <p style={{ fontSize: "14.5px", lineHeight: 1.8, color: "#4A464A", marginBottom: "32px" }}>
              Actuamos como intermediarios objetivos entre nuestros clientes y las aseguradoras, garantizando siempre la mejor cobertura al precio más competitivo del mercado.
            </p>

            {/* Taste: divide-y en lugar de cards (VISUAL_DENSITY: 4) */}
            <div style={{ borderTop: "1px solid rgba(58,19,53,0.08)" }}>
              {["Asesoría personalizada sin costo", "Gestión integral de siniestros", "Renovaciones y seguimiento continuo", "Acceso a más de 15 aseguradoras"].map((item, i) => (
                <div key={item} style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  padding: "13px 0", borderBottom: "1px solid rgba(58,19,53,0.08)",
                  opacity: inView ? 1 : 0,
                  transform: inView ? "translateX(0)" : "translateX(-8px)",
                  transition: `opacity 350ms ease, transform 350ms cubic-bezier(0.23,1,0.32,1)`,
                  transitionDelay: `${160 + i * 65}ms`,
                }}>
                  <span style={{
                    width: "20px", height: "20px", borderRadius: "99px", flexShrink: 0,
                    backgroundColor: "rgba(58,19,53,0.07)",
                    boxShadow: "0 0 0 1px rgba(58,19,53,0.15)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#3A1335",
                  }}><CheckIcon /></span>
                  <span style={{ fontSize: "14px", color: "#4A4560" }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Columna derecha — Value cards (Taste: SIN emojis, con SVG icons) */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {VALUE_CARDS.map((card, i) => {
              const Icon = card.icon;
              return (
                <div key={card.titulo}
                  className="spotlight-card"
                  style={{
                    padding: "24px",
                    opacity: inView ? 1 : 0,
                    transform: inView ? "translateY(0) scale(1)" : "translateY(14px) scale(0.97)",
                    transition: `opacity 420ms cubic-bezier(0.23,1,0.32,1), transform 420ms cubic-bezier(0.23,1,0.32,1)`,
                    transitionDelay: `${90 + i * 75}ms`,
                  }}>
                  <div style={{
                    width: "34px", height: "34px", borderRadius: "9px", marginBottom: "14px",
                    backgroundColor: "rgba(58,19,53,0.07)",
                    boxShadow: "0 0 0 1px rgba(58,19,53,0.14)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#3A1335",
                  }}><Icon /></div>
                  <p style={{ fontSize: "13.5px", fontWeight: 700, color: "#3A1335", marginBottom: "6px", letterSpacing: "-0.2px" }}>{card.titulo}</p>
                  <p style={{ fontSize: "12.5px", lineHeight: 1.68, color: "#4A464A" }}>{card.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── SECCIÓN: CTA Band ────────────────────────────────────────────────────────

function CtaSection() {
  const { ref, inView } = useInView();
  return (
    <section style={{
      padding: "100px 32px", textAlign: "center",
      background: "linear-gradient(135deg, #3A1335 0%, #3A1335 50%, #5A1D4F 100%)",
    }}>
      <div ref={ref} style={{
        maxWidth: "560px", margin: "0 auto",
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(12px)",
        transition: "opacity 500ms cubic-bezier(0.23,1,0.32,1), transform 500ms cubic-bezier(0.23,1,0.32,1)",
      }}>
        {/* Taste: NO gradient text, NO "Unleash/Seamless/Next-Gen" */}
        <h2 style={{ fontSize: "clamp(22px, 3.5vw, 36px)", fontWeight: 800, letterSpacing: "-1px", color: "#FFFFFF", marginBottom: "14px", lineHeight: 1.18 }}>
          Protege tu empresa hoy
        </h2>
        <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.75)", marginBottom: "28px", lineHeight: 1.75 }}>
          Solicita tu cotización sin compromiso. Te contactamos en menos de 24 horas con las mejores opciones del mercado.
        </p>
        <a href="/cotizar"
          style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            padding: "13px 28px", borderRadius: "10px",
            fontSize: "14.5px", fontWeight: 600, textDecoration: "none", cursor: "pointer",
            backgroundColor: "#FFFFFF", color: "#3A1335",
            transition: "background-color 140ms ease",
          }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.92)")}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#FFFFFF")}
        >
          Solicitar cotización <ArrowRightIcon />
        </a>
      </div>
    </section>
  );
}

// ─── SECCIÓN: Contacto ────────────────────────────────────────────────────────

function ContactoSection() {
  const { ref, inView } = useInView();
  const CARDS = [
    { icon: <MapPinIcon />, titulo: "Dirección", lineas: ["Torre Credicard, Piso 5", "Av. Principal del Bosque", "Caracas 1060, Miranda"] },
    { icon: <PhoneIcon />, titulo: "Teléfonos", lineas: ["+58 212-745.8878", "+58 212-745.8879", "+58 212-745.8880"] },
    { icon: <MailIcon />, titulo: "Correo electrónico", lineas: ["central@cabalasesores.com", " ", "Respuesta en menos de 24 horas"] },
  ];
  return (
    <section id="contacto" style={{ padding: "110px 32px", maxWidth: "1200px", margin: "0 auto" }}>
      <div ref={ref}>
        <div style={{
          marginBottom: "52px",
          opacity: inView ? 1 : 0,
          transform: inView ? "translateY(0)" : "translateY(10px)",
          transition: "opacity 380ms cubic-bezier(0.23,1,0.32,1), transform 380ms cubic-bezier(0.23,1,0.32,1)",
        }}>
          <Label>Contacto</Label>
          <h2 style={{ fontSize: "clamp(22px, 3.5vw, 36px)", fontWeight: 800, letterSpacing: "-1px", marginTop: "10px", color: "#3A1335" }}>
            Estamos en Caracas, para todo Venezuela
          </h2>
        </div>
        <div className="contacto-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px" }}>
          {CARDS.map((card, i) => (
            <div key={card.titulo}
              className="spotlight-card"
              style={{
                padding: "26px",
                opacity: inView ? 1 : 0,
                transform: inView ? "translateY(0) scale(1)" : "translateY(10px) scale(0.97)",
                transition: `opacity 400ms cubic-bezier(0.23,1,0.32,1), transform 400ms cubic-bezier(0.23,1,0.32,1)`,
                transitionDelay: `${i * 80}ms`,
              }}>
              <div style={{
                width: "32px", height: "32px", borderRadius: "8px", marginBottom: "16px",
                backgroundColor: "rgba(58,19,53,0.07)",
                boxShadow: "0 0 0 1px rgba(58,19,53,0.14)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#3A1335",
              }}>{card.icon}</div>
              <p style={{ fontSize: "12.5px", fontWeight: 700, color: "#3A1335", marginBottom: "10px", letterSpacing: "0.01em" }}>{card.titulo}</p>
              {card.lineas.map((l, j) => (
                <p key={j} style={{ fontSize: "13px", lineHeight: 1.85, color: "#4A464A" }}>{l}</p>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── PAGE PRINCIPAL ───────────────────────────────────────────────────────────

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <div style={{ backgroundColor: "var(--bg)", color: "var(--fg)", fontFamily: "var(--font-sans)" }}>

      {/* ════ NAVBAR ════════════════════════════════════════════════════════ */}
      <header style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        height: "56px", display: "flex", alignItems: "center",
        justifyContent: "space-between", padding: "0 32px",
        // Emil: exact props, no 'all'
        transition: "background-color 220ms ease, border-color 220ms ease, box-shadow 220ms ease",
        backgroundColor: scrolled ? "rgba(255,255,255,0.92)" : "transparent",
        borderBottom: `1px solid ${scrolled ? "rgba(58,19,53,0.09)" : "transparent"}`,
        backdropFilter: scrolled ? "blur(16px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(16px)" : "none",
        boxShadow: scrolled ? "0 1px 0 rgba(58,19,53,0.06), 0 4px 16px rgba(58,19,53,0.06)" : "none",
      }}>
        {/* Logo */}
        <a href="#inicio" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
          <div style={{
            backgroundColor: "white",
            borderRadius: "8px",
            padding: "5px 10px",
            overflow: "hidden",
            flexShrink: 0,
            boxShadow: "0 1px 4px rgba(0,0,0,0.35)",
          }}>
            <Image src="/logos/logo-cabal.png" alt="Cabal Corretaje de Seguros" width={110} height={44} style={{ objectFit: "contain", display: "block" }} />
          </div>
        </a>

        {/* Desktop nav */}
        <nav className="nav-desktop" style={{ display: "flex", gap: "26px", alignItems: "center" }}>
          {["Servicios", "Nosotros", "Contacto"].map(l => (
            <a key={l} href={`#${l.toLowerCase()}`} style={{
              fontSize: "13.5px", fontWeight: 500, color: "#4A4560", textDecoration: "none",
              transition: "color 130ms ease",
            }}
              onMouseEnter={e => (e.currentTarget.style.color = "#3A1335")}
              onMouseLeave={e => (e.currentTarget.style.color = "#4A4560")}>
              {l}
            </a>
          ))}
        </nav>

        <div className="nav-desktop" style={{ display: "flex", gap: "7px" }}>
          <Btn href="/auth/login" variant="ghost">Iniciar sesión</Btn>
          <Btn href="/cotizar">Cotizar</Btn>
        </div>

        <button onClick={() => setMenuOpen(v => !v)} className="nav-mobile"
          style={{ display: "none", background: "none", border: "none", cursor: "pointer", color: "#3A1335", padding: "5px" }}
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}>
          {menuOpen ? <XIcon /> : <MenuIcon />}
        </button>
      </header>

      {/* Mobile menu — Emil: ease-drawer + asym timing */}
      <div className="nav-mobile" style={{
        position: "fixed", top: "56px", left: 0, right: 0, zIndex: 99,
        backgroundColor: "#FFFFFF",
        borderBottom: "1px solid rgba(58,19,53,0.09)",
        overflow: "hidden", display: "none",
        maxHeight: menuOpen ? "280px" : "0px",
        transition: menuOpen
          ? "max-height 300ms cubic-bezier(0.32,0.72,0,1)"
          : "max-height 190ms cubic-bezier(0.23,1,0.32,1)",
      }}>
        <div style={{ padding: "20px 32px 24px", display: "flex", flexDirection: "column", gap: "16px" }}>
          {["Servicios", "Nosotros", "Contacto"].map(l => (
            <a key={l} href={`#${l.toLowerCase()}`} onClick={() => setMenuOpen(false)}
              style={{ fontSize: "15px", fontWeight: 500, color: "#4A4560", textDecoration: "none" }}>
              {l}
            </a>
          ))}
          <div style={{ height: "1px", backgroundColor: "rgba(58,19,53,0.09)" }} />
          <a href="/cotizar" style={{
            fontSize: "14px", fontWeight: 600, padding: "12px", borderRadius: "9px",
            backgroundColor: "#3A1335", color: "#fff", textDecoration: "none", textAlign: "center",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)",
          }}>Cotizar ahora</a>
        </div>
      </div>

      {/* ════ HERO — Taste: Asymmetric Split Screen (DV:8, centered BANEADO) ══ */}
      <section id="inicio" style={{
        minHeight: "100dvh",  // Taste: NUNCA h-screen
        display: "flex", alignItems: "center",
        padding: "80px 32px 60px",
        position: "relative", overflow: "hidden",
        backgroundColor: "#1A0830",
      }}>
        {/* Background: multi-layer gradient mesh */}
        <div aria-hidden style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: [
            "radial-gradient(ellipse 80% 55% at 70% 35%, rgba(93,45,140,0.35) 0%, transparent 60%)",
            "radial-gradient(ellipse 50% 40% at 15% 75%, rgba(155,27,48,0.08) 0%, transparent 50%)",
          ].join(", "),
        }} />
        {/* Vertical accent line */}
        <div aria-hidden style={{
          position: "absolute", top: "8%", right: "0", width: "1px", height: "84%",
          background: "linear-gradient(180deg, transparent, rgba(180,130,240,0.18) 35%, rgba(180,130,240,0.18) 65%, transparent)",
        }} />
        {/* Subtle dot grid */}
        <div aria-hidden style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }} />
        {/* Brand watermark */}
        <div aria-hidden style={{
          position: "absolute", right: "-20px", bottom: "-20px",
          width: "420px", height: "167px", pointerEvents: "none",
          backgroundImage: "url(/logos/logo-cabal.png)",
          backgroundSize: "contain", backgroundRepeat: "no-repeat", backgroundPosition: "center right",
          opacity: 0.03, filter: "grayscale(1)",
        }} />

        {/* Grid: Taste DV:8 — 55/45 split */}
        <div className="hero-grid" style={{
          display: "grid",
          // Taste: fraccionario asimétrico, NO 50/50
          gridTemplateColumns: "1.2fr 1fr",
          gap: "80px", alignItems: "center", width: "100%",
          maxWidth: "1400px", margin: "0 auto",
        }}>

          {/* ─ Izquierda: contenido ─ */}
          <div>
            {/* Badge */}
            <div className="stagger-item" style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              padding: "3px 10px 3px 5px", borderRadius: "99px",
              border: "1px solid rgba(255,255,255,0.18)",
              backgroundColor: "rgba(255,255,255,0.07)",
              // Taste: inner refraction
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
              marginBottom: "24px",
            }}>
              <span style={{
                fontSize: "10px", fontWeight: 700, letterSpacing: "0.07em",
                padding: "2px 8px", borderRadius: "99px",
                backgroundColor: "#9B1B30", color: "#fff",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15)",
              }}>SUDESEG S-746</span>
              <span style={{ fontSize: "11.5px", color: "rgba(255,255,255,0.65)" }}>Corretaje autorizado</span>
            </div>

            {/* Headline — Taste: NO gradient text en headers grandes */}
            <h1 className="stagger-item" style={{
              fontSize: "clamp(34px, 5vw, 62px)",
              fontWeight: 800, letterSpacing: "-2.5px", lineHeight: 1.07,
              color: "#fafafa", marginBottom: "20px",
              // Taste: control de jerarquía por peso/color, NO escala excesiva
            }}>
              El corredor que trabaja para ti,{" "}
              <span style={{ color: "rgba(255,255,255,0.40)" }}>no para la aseguradora</span>
            </h1>

            <p className="stagger-item" style={{
              fontSize: "clamp(14px, 1.8vw, 16.5px)", lineHeight: 1.75,
              color: "rgba(255,255,255,0.65)", maxWidth: "480px", marginBottom: "32px",
            }}>
              Más de 20 años comparando el mercado asegurador venezolano para darte la cobertura que necesitas, al precio correcto.
            </p>

            <div className="stagger-item" style={{ display: "flex", gap: "9px", flexWrap: "wrap" }}>
              <HeroPrimaryBtn href="/cotizar">
                Cotizar gratis <ArrowRightIcon />
              </HeroPrimaryBtn>
              <Btn href="#nosotros" variant="ghost" style={{ padding: "12px 24px", fontSize: "14px", borderRadius: "10px" }}>
                Conocer más
              </Btn>
            </div>
          </div>

          {/* ─ Derecha: Dashboard visual ─ */}
          <div className="stagger-item hero-right" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>

            {/* Card principal: cobertura */}
            <div style={{
              padding: "26px", borderRadius: "14px",
              backgroundColor: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.11)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "22px" }}>
                <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", color: "rgba(255,255,255,0.45)", textTransform: "uppercase" as const }}>
                  Cobertura activa
                </p>
                <span style={{
                  fontSize: "10px", padding: "3px 9px", borderRadius: "99px", fontWeight: 700,
                  backgroundColor: "rgba(16,185,129,0.1)", color: "#10b981",
                  border: "1px solid rgba(16,185,129,0.18)",
                }}>● Vigente</span>
              </div>

              {/* Coverage bars */}
              {[
                { label: "Automóvil", pct: 88, color: "#5b3cf5" },
                { label: "Salud HCM", pct: 74, color: "#0d9488" },
                { label: "Patrimoniales", pct: 61, color: "#b45309" },
              ].map((item, i) => (
                <div key={item.label} style={{ marginBottom: i < 2 ? "14px" : "0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.55)" }}>{item.label}</span>
                    <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)", fontWeight: 600 }}>{item.pct}%</span>
                  </div>
                  <div style={{ height: "3px", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "99px", overflow: "hidden" }}>
                    <div style={{
                      height: "100%", borderRadius: "99px",
                      backgroundColor: item.color,
                      ["--bar-w" as string]: `${item.pct}%`,
                      animation: `barGrow 700ms cubic-bezier(0.23,1,0.32,1) ${500 + i * 100}ms both`,
                    }} />
                  </div>
                </div>
              ))}

              {/* Stats row */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "14px", marginTop: "22px", paddingTop: "20px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                {STATS.slice(0, 2).map((s, i) => (
                  <div key={s.label} style={{ animation: `fadeUp 400ms cubic-bezier(0.23,1,0.32,1) ${420 + i * 70}ms both` }}>
                    <div style={{ fontSize: "24px", fontWeight: 800, letterSpacing: "-1.2px", color: "#fafafa", lineHeight: 1 }}>{s.valor}</div>
                    <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)", marginTop: "3px" }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Fila inferior: 2 mini-cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              {STATS.slice(2).map((s, i) => (
                <div key={s.label} style={{
                  padding: "18px 16px", borderRadius: "14px",
                  backgroundColor: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.11)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
                  animation: `fadeUp 400ms cubic-bezier(0.23,1,0.32,1) ${560 + i * 70}ms both`,
                }}>
                  <div style={{ fontSize: "20px", fontWeight: 800, letterSpacing: "-1px", color: "#fafafa", lineHeight: 1 }}>{s.valor}</div>
                  <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)", marginTop: "4px" }}>{s.label}</div>
                </div>
              ))}
              <div style={{
                padding: "18px 16px", gridColumn: "1 / -1", display: "flex", flexWrap: "wrap" as const, gap: "6px",
                borderRadius: "14px",
                backgroundColor: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.11)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
              }}>
                {RAMOS.map((r) => (
                  <span key={r.titulo} style={{
                    fontSize: "11px", padding: "3px 9px", borderRadius: "99px",
                    border: "1px solid rgba(255,255,255,0.06)",
                    backgroundColor: `${r.acento}0c`, color: r.acento,
                    fontWeight: 500,
                  }}>{r.titulo}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════ SECCIONES ═════════════════════════════════════════════════════ */}
      <AseguradorasBand />
      <ServiciosSection />
      <ComoFuncionaSection />
      <NosotrosSection />
      <CtaSection />
      <ContactoSection />

      {/* ════ FOOTER ════════════════════════════════════════════════════════ */}
      <footer style={{
        borderTop: "1px solid rgba(255,255,255,0.08)",
        backgroundColor: "#1A0830", padding: "26px 32px",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              backgroundColor: "white",
              borderRadius: "5px",
              padding: "3px 7px",
              overflow: "hidden",
              flexShrink: 0,
              opacity: 0.85,
            }}>
              <Image src="/logos/logo-cabal.png" alt="Cabal" width={72} height={29} style={{ objectFit: "contain", display: "block" }} />
            </div>
            <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)" }}>
              © {new Date().getFullYear()} Cabal Corretaje de Seguros, C.A. · SUDESEG S-746
            </span>
          </div>
          <div style={{ display: "flex", gap: "20px" }}>
            {["Términos", "Privacidad"].map(l => (
              <a key={l} href="#" style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)", textDecoration: "none", transition: "color 130ms ease" }}
                onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.65)")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}>
                {l}
              </a>
            ))}
          </div>
        </div>
      </footer>

      {/* WhatsApp floating button */}
      <WhatsAppBtn />

      {/* ─── Responsive + Keyframes ─── */}
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes barGrow {
          from { width: 0%; }
          to   { width: var(--bar-w, 100%); }
        }
        @keyframes whatsappPulse {
          0%   { transform: scale(1);   opacity: 0.7; }
          65%  { transform: scale(1.7); opacity: 0; }
          100% { transform: scale(1.7); opacity: 0; }
        }

        /* Emil: hover guard */
        @media (hover: none) {
          .spotlight-card:hover { transform: none !important; }
        }

        @media (max-width: 900px) {
          .hero-grid  { grid-template-columns: 1fr !important; gap: 40px !important; }
          .hero-right { display: none !important; }
        }

        @media (max-width: 768px) {
          .nosotros-grid { grid-template-columns: 1fr !important; gap: 44px !important; }
          .ramos-row-1, .ramos-row-2 { grid-template-columns: 1fr !important; }
          .contacto-grid  { grid-template-columns: 1fr !important; }
          .pasos-grid     { grid-template-columns: 1fr 1fr !important; }
        }

        @media (max-width: 480px) {
          .pasos-grid { grid-template-columns: 1fr !important; }
        }

        /* Taste: prefers-reduced-motion */
        @media (prefers-reduced-motion: reduce) {
          .stagger-item { animation: none !important; opacity: 1 !important; }
          * { transition-duration: 50ms !important; animation-duration: 50ms !important; }
        }
      `}</style>
    </div>
  );
}
