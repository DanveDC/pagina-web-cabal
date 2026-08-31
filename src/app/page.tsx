"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

// ─── SVG ICONS ────────────────────────────────────────────────────────────────

const ArrowRightIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);
const MenuIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);
const XIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const ShieldIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
const WhatsAppIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

// ─── HOOK: useInView ──────────────────────────────────────────────────────────

function useInView(margin = "-60px") {
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

// ─── DATA ─────────────────────────────────────────────────────────────────────

const PLANES = [
  {
    nombre: "Cobertura Básica",
    precio: "Desde $XX/mes",
    destacado: false,
    beneficios: [
      "Seguro de salud HCM básico",
      "RC vehicular obligatoria",
      "Asistencia telefónica 24/7",
      "Renovación anual garantizada",
    ],
  },
  {
    nombre: "Protección Vital",
    precio: "Desde $XX/mes",
    destacado: true,
    tag: "Más elegido",
    beneficios: [
      "HCM con red ampliada",
      "Casco + RC para flota",
      "Patrimonial básico incluido",
      "Asesor dedicado",
      "Gestión de siniestros prioritaria",
    ],
  },
  {
    nombre: "Previsión Elite",
    precio: "Desde $XX/mes",
    destacado: false,
    beneficios: [
      "HCM premium + internacional",
      "Flota completa todo riesgo",
      "Multirriesgo empresarial",
      "Vida colectivo incluido",
      "Asesor senior dedicado",
      "SLA de respuesta 4 horas",
    ],
  },
  {
    nombre: "Global Shield",
    precio: "A medida",
    destacado: false,
    beneficios: [
      "Cobertura internacional",
      "Diseño de programa a medida",
      "Acceso a reaseguradoras globales",
      "Auditoría anual de riesgos",
      "Gerente de cuenta exclusivo",
      "Reporting ejecutivo mensual",
    ],
  },
];

// ─── COMPONENTE: WhatsApp float ───────────────────────────────────────────────

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
        width: "56px", height: "56px", borderRadius: "9999px",
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
        position: "absolute", inset: 0, borderRadius: "9999px",
        border: "2px solid rgba(37,211,102,0.5)",
        animation: visible ? "whatsappPulse 2.8s ease-out infinite" : "none",
      }} />
    </a>
  );
}

// ─── SECCIÓN: Planes comparativos (PRESERVADA INTACTA) ────────────────────────

function PlanesSection() {
  const { ref, inView } = useInView();
  return (
    <section id="planes" style={{ padding: "96px 32px", backgroundColor: "#fff7f9" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div ref={ref} style={{
          textAlign: "center", marginBottom: "56px",
          opacity: inView ? 1 : 0,
          transform: inView ? "translateY(0)" : "translateY(12px)",
          transition: "opacity 400ms cubic-bezier(0.23,1,0.32,1), transform 400ms cubic-bezier(0.23,1,0.32,1)",
        }}>
          <span style={{
            display: "inline-block",
            fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em",
            textTransform: "uppercase", color: "#C2A378", marginBottom: "12px",
          }}>Planes de Protección</span>
          <h2 style={{
            fontFamily: "var(--font-playfair, var(--font-display))",
            fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 700,
            color: "#3a1335", letterSpacing: "-0.02em", lineHeight: 1.2,
          }}>
            Cuadro Comparativo de Planes
          </h2>
          <p style={{ fontSize: "16px", color: "#4e444b", marginTop: "12px", maxWidth: "480px", margin: "12px auto 0", lineHeight: 1.6 }}>
            Encontrá la cobertura que se adapta a las necesidades de tu empresa.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }} className="planes-grid">
          {PLANES.map((plan, i) => (
            <div
              key={plan.nombre}
              style={{
                backgroundColor: plan.destacado ? "#3a1335" : "#ffffff",
                border: `1px solid ${plan.destacado ? "#3a1335" : "#d2c2cb"}`,
                borderRadius: "8px",
                padding: "28px 22px",
                position: "relative",
                boxShadow: plan.destacado ? "0px 10px 40px rgba(58, 19, 53, 0.18)" : "none",
                opacity: inView ? 1 : 0,
                transform: inView
                  ? plan.destacado ? "translateY(-6px)" : "translateY(0)"
                  : "translateY(16px)",
                transition: `opacity 400ms cubic-bezier(0.23,1,0.32,1) ${i * 70}ms, transform 400ms cubic-bezier(0.23,1,0.32,1) ${i * 70}ms`,
              }}
            >
              {plan.tag && (
                <div style={{
                  position: "absolute", top: "-12px", left: "50%", transform: "translateX(-50%)",
                  backgroundColor: "#C2A378", color: "#fff",
                  fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em",
                  padding: "3px 14px", borderRadius: "9999px",
                  whiteSpace: "nowrap",
                }}>{plan.tag}</div>
              )}

              <h3 style={{
                fontFamily: "var(--font-playfair, var(--font-display))",
                fontSize: "18px", fontWeight: 600,
                color: plan.destacado ? "#ffffff" : "#3a1335",
                marginBottom: "6px",
              }}>{plan.nombre}</h3>

              <div style={{
                fontSize: "13px", fontWeight: 600,
                color: plan.destacado ? "#C2A378" : "#80747b",
                marginBottom: "20px",
              }}>{plan.precio}</div>

              <div style={{ borderTop: `1px solid ${plan.destacado ? "rgba(255,255,255,0.15)" : "#f5ebef"}`, paddingTop: "18px" }}>
                {plan.beneficios.map((b) => (
                  <div key={b} style={{
                    display: "flex", alignItems: "flex-start", gap: "8px",
                    marginBottom: "10px",
                  }}>
                    <span style={{
                      width: "18px", height: "18px", borderRadius: "9999px",
                      backgroundColor: plan.destacado ? "rgba(194,163,120,0.20)" : "rgba(58,19,53,0.07)",
                      border: `1px solid ${plan.destacado ? "rgba(194,163,120,0.40)" : "rgba(58,19,53,0.15)"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: plan.destacado ? "#C2A378" : "#3a1335",
                      flexShrink: 0, marginTop: "1px",
                    }}><CheckIcon /></span>
                    <span style={{ fontSize: "13px", lineHeight: 1.5, color: plan.destacado ? "rgba(255,255,255,0.85)" : "#4e444b" }}>{b}</span>
                  </div>
                ))}
              </div>

              <a href="/cotizar" style={{
                display: "block", textAlign: "center",
                marginTop: "20px", padding: "10px",
                borderRadius: "4px",
                backgroundColor: plan.destacado ? "#C2A378" : "transparent",
                border: `1px solid ${plan.destacado ? "#C2A378" : "#d2c2cb"}`,
                color: plan.destacado ? "#ffffff" : "#3a1335",
                fontSize: "13px", fontWeight: 600,
                textDecoration: "none",
                transition: "background-color 140ms ease, border-color 140ms ease",
              }}
                onMouseEnter={e => {
                  if (plan.destacado) {
                    e.currentTarget.style.backgroundColor = "#B8956A";
                  } else {
                    e.currentTarget.style.borderColor = "#3a1335";
                  }
                }}
                onMouseLeave={e => {
                  if (plan.destacado) {
                    e.currentTarget.style.backgroundColor = "#C2A378";
                  } else {
                    e.currentTarget.style.borderColor = "#d2c2cb";
                  }
                }}
              >
                Solicitar cotización
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── PAGE PRINCIPAL ───────────────────────────────────────────────────────────

export default function LandingPage() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [cotizadorTipo, setCotizadorTipo] = useState("empresa");
  const [cotizadorRamo, setCotizadorRamo] = useState("");
  const [cotizadorNombre, setCotizadorNombre] = useState("");
  const [cotizadorSuma, setCotizadorSuma] = useState("");

  // Hover states for contact section icons
  const [phoneHover, setPhoneHover] = useState(false);
  const [waHover, setWaHover] = useState(false);

  // Contact form state
  const [formData, setFormData] = useState({ nombre: "", rif: "", email: "", mensaje: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  // Hover state for ramos cards
  const [ramoHover, setRamoHover] = useState<number | null>(null);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    await new Promise(r => setTimeout(r, 1500));
    setSending(false);
    setSent(true);
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "10px", fontWeight: 700,
    textTransform: "uppercase", letterSpacing: "0.2em",
    color: "#4e444b", marginBottom: "8px",
  };

  const inputStyle: React.CSSProperties = {
    background: "transparent", border: "none",
    borderBottom: "1px solid #d2c2cb",
    padding: "12px 0", width: "100%",
    fontSize: "14px", color: "#1f1a1d",
    outline: "none", boxSizing: "border-box",
    fontFamily: "inherit",
  };

  const RAMOS_CARDS = [
    {
      titulo: "Seguros de Salud",
      desc: "Cobertura nacional e internacional (HCM) con acceso a las redes clínicas más prestigiosas del país.",
      badge: "Persona",
      img: "/images/salud.jpg",
      icon: "salud",
    },
    {
      titulo: "Automóvil",
      desc: "Protección total contra daños propios, robo y RCV, con asistencia vial las 24 horas del día.",
      badge: "Auto",
      img: "/images/auto.jpg",
      icon: "auto",
    },
    {
      titulo: "Patrimonios",
      desc: "Cobertura para bienes inmuebles: casas, apartamentos y activos de bienes raíces. Protección contra incendio, robo y responsabilidad civil.",
      badge: "Patrimonios",
      img: "/images/corporativo.jpg",
      icon: "patrimonio",
    },
  ];

  return (
    <div style={{ backgroundColor: "#fff7f9", color: "#1f1a1d", fontFamily: "var(--font-inter, system-ui, sans-serif)" }}>

      {/* ════ NAVBAR ════════════════════════════════════════════════════════ */}
      <header style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        height: "80px",
        display: "flex", alignItems: "center",
        justifyContent: "space-between", padding: "0 32px",
        transition: "background-color 300ms ease, box-shadow 300ms ease",
        backgroundColor: scrolled ? "#3a1335" : "transparent",
        backdropFilter: scrolled ? "none" : "blur(12px)",
        WebkitBackdropFilter: scrolled ? "none" : "blur(12px)",
        boxShadow: scrolled ? "0 4px 24px rgba(0,0,0,0.25)" : "none",
      }}>
        {/* Logo */}
        <a href="#inicio" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
          <img
            src="/images/logo.png"
            alt="Cabal Logo"
            style={{ filter: "brightness(0) invert(1)", height: "48px", width: "auto" }}
          />
        </a>

        {/* Desktop nav */}
        <nav className="nav-desktop" style={{ display: "flex", gap: "32px", alignItems: "center" }}>
          {[
            { label: "Inicio", href: "#inicio" },
            { label: "Cotizador", href: "#cotizador" },
            { label: "Ramos", href: "#ramos" },
            { label: "Nosotros", href: "#nosotros" },
            { label: "Contacto", href: "#contacto" },
          ].map(l => (
            <a key={l.label} href={l.href} style={{
              fontSize: "12px", fontWeight: 600,
              letterSpacing: "0.1em", textTransform: "uppercase",
              color: "white", textDecoration: "none",
              transition: "color 150ms ease",
            }}
              onMouseEnter={e => (e.currentTarget.style.color = "#ffd7f3")}
              onMouseLeave={e => (e.currentTarget.style.color = "white")}>
              {l.label}
            </a>
          ))}
        </nav>

        <div className="nav-desktop" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <a href="/emitir" style={{
            display: "inline-flex", alignItems: "center",
            padding: "10px 20px", borderRadius: "4px",
            fontSize: "12px", fontWeight: 700,
            letterSpacing: "0.1em", textTransform: "uppercase",
            textDecoration: "none",
            color: "#C2A378", backgroundColor: "transparent",
            border: "1.5px solid rgba(194,163,120,0.6)",
            transition: "all 140ms ease",
          }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = "rgba(194,163,120,0.1)"; e.currentTarget.style.borderColor = "#C2A378"; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.borderColor = "rgba(194,163,120,0.6)"; }}
          >
            Emitir Póliza
          </a>
          <a href="/cotizar" style={{
            display: "inline-flex", alignItems: "center",
            padding: "10px 24px", borderRadius: "4px",
            fontSize: "12px", fontWeight: 700,
            letterSpacing: "0.1em", textTransform: "uppercase",
            textDecoration: "none",
            color: "#3a1335", backgroundColor: "white",
            transition: "opacity 150ms ease",
          }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.9")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
          >
            Cotizar
          </a>
        </div>

        <button onClick={() => setMenuOpen(v => !v)} className="nav-mobile"
          style={{ display: "none", background: "none", border: "none", cursor: "pointer", color: "white", padding: "5px" }}
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}>
          {menuOpen ? <XIcon /> : <MenuIcon />}
        </button>
      </header>

      {/* Mobile menu */}
      <div className="nav-mobile" style={{
        position: "fixed", top: "80px", left: 0, right: 0, zIndex: 49,
        backgroundColor: "#3a1335",
        overflow: "hidden", display: "none",
        maxHeight: menuOpen ? "340px" : "0px",
        transition: menuOpen
          ? "max-height 300ms cubic-bezier(0.32,0.72,0,1)"
          : "max-height 190ms cubic-bezier(0.23,1,0.32,1)",
      }}>
        <div style={{ padding: "20px 32px 28px", display: "flex", flexDirection: "column", gap: "20px" }}>
          {[
            { label: "Inicio", href: "#inicio" },
            { label: "Cotizador", href: "#cotizador" },
            { label: "Ramos", href: "#ramos" },
            { label: "Nosotros", href: "#nosotros" },
            { label: "Contacto", href: "#contacto" },
          ].map(l => (
            <a key={l.label} href={l.href} onClick={() => setMenuOpen(false)}
              style={{ fontSize: "12px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "white", textDecoration: "none" }}>
              {l.label}
            </a>
          ))}
          <a href="/emitir" style={{
            fontSize: "12px", fontWeight: 700, padding: "12px 24px", borderRadius: "4px",
            backgroundColor: "transparent", color: "#C2A378", textDecoration: "none", textAlign: "center",
            letterSpacing: "0.1em", textTransform: "uppercase",
            border: "1.5px solid rgba(194,163,120,0.6)",
          }}>Emitir Póliza</a>
          <a href="/cotizar" style={{
            fontSize: "12px", fontWeight: 700, padding: "12px 24px", borderRadius: "4px",
            backgroundColor: "white", color: "#3a1335", textDecoration: "none", textAlign: "center",
            letterSpacing: "0.1em", textTransform: "uppercase",
          }}>Cotizar</a>
        </div>
      </div>

      {/* ════ HERO ══════════════════════════════════════════════════════════ */}
      <section id="inicio" style={{
        minHeight: "100vh",
        display: "flex", alignItems: "center",
        overflow: "hidden", paddingTop: "80px",
        position: "relative",
      }}>
        {/* Background image */}
        <img
          src="/images/hero-bg.jpg"
          alt=""
          aria-hidden
          style={{
            position: "absolute", inset: 0,
            width: "100%", height: "100%",
            objectFit: "cover", objectPosition: "center",
          }}
        />
        {/* Gradient overlay */}
        <div aria-hidden style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(rgba(58, 19, 53, 0.85), rgba(58, 19, 53, 0.6))",
        }} />

        {/* Content grid */}
        <div style={{
          position: "relative", zIndex: 1,
          display: "grid", gridTemplateColumns: "1.1fr 1fr",
          gap: "72px", alignItems: "center",
          width: "100%", maxWidth: "1320px",
          margin: "0 auto", padding: "64px 32px",
        }} className="hero-grid">

          {/* ─ Left ─ */}
          <div>
            {/* Badge */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              background: "rgba(255,255,255,0.10)",
              backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.20)",
              borderRadius: "9999px", padding: "8px 16px",
              marginBottom: "32px",
            }}>
              <ShieldIcon />
              <span style={{
                fontSize: "10px", fontWeight: 700,
                letterSpacing: "0.1em", textTransform: "uppercase",
                color: "white",
              }}>
                Inscritos ante la SUDEASEG · N° SCSMP-000002
              </span>
            </div>

            {/* H1 */}
            <h1 style={{
              fontFamily: "var(--font-playfair, Georgia, serif)",
              fontSize: "clamp(40px, 5.5vw, 72px)",
              fontWeight: 700, lineHeight: 1.1,
              color: "white", marginBottom: "32px",
            }}>
              La tranquilidad de saber que tu futuro está protegido por manos expertas.
            </h1>

            <p style={{
              color: "rgba(255,255,255,0.80)", fontSize: "20px",
              marginBottom: "48px", maxWidth: "512px", lineHeight: 1.6,
            }}>
              Intermediación de seguros digitales y tradicionales con el respaldo de las aseguradoras más sólidas del país.
            </p>

            <div style={{ display: "flex", gap: "24px", alignItems: "center", flexWrap: "wrap" }}>
              <a href="#planes" style={{
                display: "inline-flex", alignItems: "center",
                padding: "16px 40px", borderRadius: "4px",
                backgroundColor: "white", color: "#3a1335",
                fontSize: "14px", fontWeight: 700,
                letterSpacing: "0.1em", textTransform: "uppercase",
                textDecoration: "none",
                transition: "opacity 150ms ease",
              }}
                onMouseEnter={e => (e.currentTarget.style.opacity = "0.9")}
                onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
              >
                Explorar Planes
              </a>
              <a href="https://sudeaseg.gob.ve" target="_blank" rel="noopener noreferrer" style={{
                display: "inline-flex", alignItems: "center", gap: "8px",
                color: "rgba(255,255,255,0.80)", background: "transparent",
                border: "none", fontSize: "14px", fontWeight: 600,
                letterSpacing: "0.1em", textTransform: "uppercase",
                textDecoration: "none", cursor: "pointer",
                transition: "color 150ms ease",
              }}
                onMouseEnter={e => (e.currentTarget.style.color = "white")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.80)")}
              >
                Registro SUDEASEG ↗
              </a>
            </div>
          </div>

          {/* ─ Right: Cotizador Express ─ */}
          <div id="cotizador" style={{
            background: "rgba(255,255,255,0.95)",
            backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
            padding: "48px",
            borderRadius: "16px",
            boxShadow: "0 25px 50px rgba(0,0,0,0.25)",
            border: "1px solid rgba(255,255,255,0.10)",
          }} className="hero-right">
            <h2 style={{
              fontFamily: "var(--font-playfair, Georgia, serif)",
              fontSize: "30px", fontWeight: 700,
              color: "#3a1335", marginBottom: "32px", textAlign: "center",
            }}>
              Cotizador Express
            </h2>

            <div style={{ marginBottom: "24px" }}>
              <label style={labelStyle}>Nombre Completo</label>
              <input
                type="text"
                placeholder="Ej. Juan Pérez"
                value={cotizadorNombre}
                onChange={e => setCotizadorNombre(e.target.value)}
                style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderBottomColor = "#3a1335")}
                onBlur={e => (e.currentTarget.style.borderBottomColor = "#d2c2cb")}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
              <div>
                <label style={labelStyle}>Ramo</label>
                <select
                  value={cotizadorRamo}
                  onChange={e => setCotizadorRamo(e.target.value)}
                  style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}
                  onFocus={e => (e.currentTarget.style.borderBottomColor = "#3a1335")}
                  onBlur={e => (e.currentTarget.style.borderBottomColor = "#d2c2cb")}
                >
                  <option value="">Seleccionar...</option>
                  <option value="auto">Auto</option>
                  <option value="persona">Persona</option>
                  <option value="fianza">Fianza</option>
                  <option value="patrimonio">Patrimonio</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Suma Asegurada ($)</label>
                <input
                  type="number"
                  placeholder="Ej. 50,000"
                  value={cotizadorSuma}
                  onChange={e => setCotizadorSuma(e.target.value)}
                  style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderBottomColor = "#3a1335")}
                  onBlur={e => (e.currentTarget.style.borderBottomColor = "#d2c2cb")}
                />
              </div>
            </div>

            {/* Tipo selector (mantiene el estado cotizadorTipo) */}
            <div style={{ marginBottom: "32px" }}>
              <label style={labelStyle}>Tipo de Cliente</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "8px" }}>
                {[
                  { id: "empresa", label: "Empresa" },
                  { id: "persona", label: "Persona Natural" },
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setCotizadorTipo(t.id)}
                    style={{
                      padding: "10px",
                      borderRadius: "4px",
                      border: `1px solid ${cotizadorTipo === t.id ? "#3a1335" : "#d2c2cb"}`,
                      backgroundColor: cotizadorTipo === t.id ? "rgba(58,19,53,0.06)" : "transparent",
                      color: cotizadorTipo === t.id ? "#3a1335" : "#4e444b",
                      fontSize: "13px", fontWeight: cotizadorTipo === t.id ? 700 : 400,
                      cursor: "pointer", transition: "all 140ms ease",
                    }}
                  >{t.label}</button>
                ))}
              </div>
            </div>

            <button
              onClick={() => router.push("/cotizar")}
              style={{
                width: "100%", background: "#3a1335",
                color: "white", padding: "20px",
                borderRadius: "12px", fontWeight: 700,
                textTransform: "uppercase", letterSpacing: "0.2em",
                fontSize: "12px", border: "none", cursor: "pointer",
                transition: "opacity 150ms ease",
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.9")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
            >
              Ver Comparativa de Planes
            </button>
          </div>
        </div>
      </section>

      {/* ════ TRUST BAND ════════════════════════════════════════════════════ */}
      <div style={{
        background: "#3a1335",
        padding: "48px 32px",
        borderTop: "1px solid rgba(255,255,255,0.05)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}>
        <div style={{
          maxWidth: "1200px", margin: "0 auto",
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
          gap: "16px", textAlign: "center",
        }} className="stats-grid">
          {[
            { valor: "20+", label: "Años de Trayectoria" },
            { valor: "SUDEASEG", label: "Corretaje Certificado" },
            { valor: "15+", label: "Aseguradoras Aliadas" },
            { valor: "24/7", label: "Atención en Siniestros" },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontSize: "30px", fontWeight: 700, color: "white" }}>{s.valor}</div>
              <div style={{
                fontSize: "10px", fontWeight: 700,
                textTransform: "uppercase", letterSpacing: "0.1em",
                color: "rgba(255,255,255,0.50)", marginTop: "8px",
              }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ════ PLANES COMPARATIVOS (PRESERVADO) ══════════════════════════════ */}
      <PlanesSection />

      {/* ════ ABOUT / EXCELENCIA ════════════════════════════════════════════ */}
      <section id="nosotros" style={{ padding: "96px 32px", background: "#fff7f9" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "80px", alignItems: "center" }} className="excelencia-grid">

            {/* Left */}
            <div>
              <span style={{
                color: "#3a1335", fontWeight: 700,
                textTransform: "uppercase", letterSpacing: "0.1em",
                fontSize: "12px", display: "block", marginBottom: "16px",
              }}>Trayectoria Institucional</span>

              <h2 style={{
                fontFamily: "var(--font-playfair, Georgia, serif)",
                fontSize: "clamp(32px, 4vw, 52px)", fontWeight: 700,
                color: "#1f1a1d", marginBottom: "32px", lineHeight: 1.2,
              }}>
                Comprometidos con la excelencia en cada gestión.
              </h2>

              <p style={{ color: "#4e444b", fontSize: "18px", lineHeight: 1.6, marginBottom: "20px" }}>
                Cabal Corretaje de Seguros, C.A. es un corredor independiente inscrito ante SUDEASEG bajo la licencia SCSMP-000002, con más de 20 años protegiendo empresas y familias venezolanas.
              </p>
              <p style={{ color: "#4e444b", fontSize: "18px", lineHeight: 1.6, marginBottom: "40px" }}>
                Actuamos como intermediarios objetivos, sin ataduras con ninguna aseguradora, garantizando siempre la mejor cobertura al precio más competitivo del mercado.
              </p>

              <a href="#contacto" style={{
                color: "#3a1335", fontWeight: 700,
                textTransform: "uppercase", letterSpacing: "0.1em",
                fontSize: "14px", display: "inline-flex",
                alignItems: "center", gap: "12px",
                textDecoration: "none", transition: "gap 150ms ease",
              }}
                onMouseEnter={e => (e.currentTarget.style.gap = "16px")}
                onMouseLeave={e => (e.currentTarget.style.gap = "12px")}
              >
                Conoce más sobre nuestro equipo →
              </a>
            </div>

            {/* Right — image + floating card */}
            <div style={{ position: "relative" }}>
              <img
                src="/images/hero-bg.jpg"
                alt="Equipo Cabal"
                style={{
                  borderRadius: "16px", width: "100%",
                  aspectRatio: "4/3", objectFit: "cover",
                  boxShadow: "0 25px 50px rgba(58,19,53,0.15)",
                  border: "1px solid #d2c2cb", display: "block",
                }}
              />
              {/* Floating card */}
              <div style={{
                position: "absolute", bottom: "-40px", left: "-40px",
                background: "white", padding: "24px",
                borderRadius: "12px",
                boxShadow: "0 25px 50px rgba(58,19,53,0.15)",
                border: "1px solid #d2c2cb",
                display: "flex", alignItems: "center", gap: "16px",
              }}>
                <div style={{
                  width: "48px", height: "48px",
                  borderRadius: "8px", background: "#3a1335",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <CheckIcon />
                </div>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "#1f1a1d" }}>Solidez Certificada</div>
                  <div style={{
                    fontSize: "10px", fontWeight: 700,
                    textTransform: "uppercase", letterSpacing: "0.1em",
                    color: "#4e444b", marginTop: "4px",
                  }}>Inscritos ante la SUDEASEG</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════ RAMOS DE PROTECCIÓN ═══════════════════════════════════════════ */}
      <section id="ramos" style={{ padding: "96px 32px", background: "#f5ebef" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <h2 style={{
              fontFamily: "var(--font-playfair, Georgia, serif)",
              fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 700,
              color: "#3a1335",
            }}>
              Nuestros Ramos de Protección
            </h2>
            <p style={{ color: "#4e444b", marginTop: "16px", fontSize: "18px" }}>
              Soluciones integrales para personas y empresas
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px" }} className="ramos-grid">
            {RAMOS_CARDS.map((ramo, i) => (
              <div
                key={ramo.titulo}
                onMouseEnter={() => setRamoHover(i)}
                onMouseLeave={() => setRamoHover(null)}
                style={{
                  background: "white",
                  borderRadius: "16px", overflow: "hidden",
                  border: "1px solid #d2c2cb",
                  transition: "transform 0.3s ease, box-shadow 0.3s ease",
                  transform: ramoHover === i ? "translateY(-8px)" : "translateY(0)",
                  boxShadow: ramoHover === i
                    ? "0 20px 40px rgba(58,19,53,0.1)"
                    : "0 2px 8px rgba(58,19,53,0.04)",
                  cursor: "default",
                }}
              >
                {/* Image */}
                <div style={{ position: "relative", height: "224px", overflow: "hidden" }}>
                  <img
                    src={ramo.img}
                    alt={ramo.titulo}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                  <span style={{
                    position: "absolute", top: "16px", left: "16px",
                    background: "#3a1335", color: "white",
                    fontSize: "11px", fontWeight: 700,
                    padding: "4px 12px", borderRadius: "9999px",
                  }}>{ramo.badge}</span>
                </div>

                {/* Body */}
                <div style={{ padding: "28px" }}>
                  <div style={{ marginBottom: "16px", color: "#3a1335" }}>
                    {ramo.icon === "salud" && (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                      </svg>
                    )}
                    {ramo.icon === "auto" && (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v9a2 2 0 0 1-2 2h-2"/>
                        <circle cx="9" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>
                      </svg>
                    )}
                    {ramo.icon === "patrimonio" && (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                        <polyline points="9 22 9 12 15 12 15 22"/>
                      </svg>
                    )}
                  </div>
                  <h3 style={{
                    fontFamily: "var(--font-playfair, Georgia, serif)",
                    fontSize: "20px", fontWeight: 700,
                    color: "#3a1335", marginBottom: "12px",
                  }}>{ramo.titulo}</h3>
                  <p style={{ color: "#4e444b", fontSize: "14px", lineHeight: 1.7, marginBottom: "20px" }}>
                    {ramo.desc}
                  </p>
                  <a href="#contacto" style={{
                    color: "#3a1335", fontWeight: 700,
                    fontSize: "13px", letterSpacing: "0.05em",
                    textDecoration: "none", display: "inline-flex",
                    alignItems: "center", gap: "6px",
                    transition: "gap 150ms ease",
                  }}
                    onMouseEnter={e => (e.currentTarget.style.gap = "10px")}
                    onMouseLeave={e => (e.currentTarget.style.gap = "6px")}
                  >
                    Solicitar información <ArrowRightIcon />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════ #SIEMPRE PRESENTE ══════════════════════════════════════════════ */}
      <section style={{
        background: "#fbf1f5",
        padding: "80px 32px",
        borderTop: "1px solid #d2c2cb",
        borderBottom: "1px solid #d2c2cb",
        overflow: "hidden",
        display: "flex", flexDirection: "column", alignItems: "center",
        textAlign: "center",
      }}>
        <img
          src="/images/logo2.png"
          alt="#SiemprePresente"
          style={{ height: "128px", width: "auto" }}
        />
        <div style={{
          color: "rgba(58,19,53,0.60)", fontSize: "14px",
          letterSpacing: "0.3em", fontWeight: 600,
          textTransform: "uppercase", marginTop: "32px",
        }}>
          Cabal Corretaje de Seguros, C.A.
        </div>
        <div style={{
          color: "rgba(58,19,53,0.40)", fontSize: "10px",
          letterSpacing: "0.2em", fontWeight: 700,
          textTransform: "uppercase", marginTop: "8px",
        }}>
          SUDEASEG SCSMP-000002
        </div>
      </section>

      {/* ════ CONTACTO ══════════════════════════════════════════════════════ */}
      <section id="contacto" style={{ padding: "96px 32px", background: "#fbf1f5" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "28px", alignItems: "start" }} className="contacto-grid-main">

            {/* Left — dark card */}
            <div style={{
              background: "#3a1335", color: "white",
              padding: "48px", borderRadius: "24px",
              display: "flex", flexDirection: "column", justifyContent: "space-between",
              boxShadow: "0 25px 50px rgba(0,0,0,0.25)",
              minHeight: "500px",
            }}>
              <div>
                <h2 style={{
                  fontFamily: "var(--font-playfair, Georgia, serif)",
                  fontSize: "clamp(28px, 3vw, 36px)", fontWeight: 700,
                  marginBottom: "32px", lineHeight: 1.3,
                }}>
                  Atención inmediata cuando más nos necesita.
                </h2>
                <p style={{ color: "rgba(255,255,255,0.70)", marginBottom: "48px", fontSize: "18px", lineHeight: 1.6 }}>
                  Nuestro equipo está disponible para acompañarle en todo momento, desde la cotización hasta la gestión de su siniestro.
                </p>

                {/* Phone */}
                <div
                  style={{ display: "flex", gap: "24px", alignItems: "center", marginBottom: "32px" }}
                  onMouseEnter={() => setPhoneHover(true)}
                  onMouseLeave={() => setPhoneHover(false)}
                >
                  <div style={{
                    width: "64px", height: "64px", borderRadius: "9999px", flexShrink: 0,
                    background: phoneHover ? "white" : "rgba(255,255,255,0.10)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "background 200ms ease",
                  }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                      stroke={phoneHover ? "#3a1335" : "white"} strokeWidth="2"
                      strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.56 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                  </div>
                  <div>
                    <div style={{
                      fontSize: "10px", fontWeight: 700,
                      textTransform: "uppercase", letterSpacing: "0.2em",
                      color: "rgba(255,255,255,0.50)", marginBottom: "4px",
                    }}>Teléfono</div>
                    <a href="tel:+582125550100" style={{
                      color: "white", textDecoration: "none",
                      fontSize: "24px", fontWeight: 700,
                    }}>+58 (212) 555-0100</a>
                  </div>
                </div>

                {/* WhatsApp */}
                <div
                  style={{ display: "flex", gap: "24px", alignItems: "center" }}
                  onMouseEnter={() => setWaHover(true)}
                  onMouseLeave={() => setWaHover(false)}
                >
                  <div style={{
                    width: "64px", height: "64px", borderRadius: "9999px", flexShrink: 0,
                    background: waHover ? "white" : "rgba(255,255,255,0.10)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "background 200ms ease",
                  }}>
                    <svg width="24" height="24" viewBox="0 0 24 24"
                      fill={waHover ? "#3a1335" : "white"}>
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </div>
                  <div>
                    <div style={{
                      fontSize: "10px", fontWeight: 700,
                      textTransform: "uppercase", letterSpacing: "0.2em",
                      color: "rgba(255,255,255,0.50)", marginBottom: "4px",
                    }}>WhatsApp</div>
                    <div style={{ fontSize: "24px", fontWeight: 700, color: "white" }}>
                      Atención por Chat
                    </div>
                  </div>
                </div>
              </div>

              <div style={{
                borderTop: "1px solid rgba(255,255,255,0.10)",
                paddingTop: "32px", marginTop: "64px",
                fontSize: "10px", fontWeight: 700,
                textTransform: "uppercase", letterSpacing: "0.2em",
                color: "rgba(255,255,255,0.40)",
              }}>
                CABAL CORRETAJE DE SEGUROS, C.A. | RIF: J-405144750
              </div>
            </div>

            {/* Right — white form */}
            <div style={{
              background: "white", padding: "48px",
              borderRadius: "24px", border: "1px solid #d2c2cb",
              boxShadow: "0 20px 40px rgba(58,19,53,0.08)",
            }}>
              <h3 style={{
                fontFamily: "var(--font-playfair, Georgia, serif)",
                fontSize: "30px", fontWeight: 700,
                color: "#3a1335", marginBottom: "32px",
              }}>
                Solicitar Asesoría Personalizada
              </h3>

              {sent ? (
                <div style={{ textAlign: "center", padding: "48px 0" }}>
                  <div style={{
                    width: "64px", height: "64px", borderRadius: "9999px",
                    background: "rgba(58,19,53,0.08)", border: "1px solid rgba(58,19,53,0.2)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto 16px", color: "#3a1335",
                  }}><CheckIcon /></div>
                  <p style={{ fontSize: "18px", fontWeight: 700, color: "#3a1335" }}>¡Solicitud enviada!</p>
                  <p style={{ fontSize: "14px", color: "#4e444b", marginTop: "8px" }}>Le contactamos a la brevedad.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                    <div>
                      <label style={labelStyle}>Nombre o Razón Social</label>
                      <input
                        type="text"
                        value={formData.nombre}
                        onChange={e => setFormData(p => ({ ...p, nombre: e.target.value }))}
                        style={inputStyle}
                        onFocus={e => (e.currentTarget.style.borderBottomColor = "#3a1335")}
                        onBlur={e => (e.currentTarget.style.borderBottomColor = "#d2c2cb")}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>RIF / Cédula</label>
                      <input
                        type="text"
                        value={formData.rif}
                        onChange={e => setFormData(p => ({ ...p, rif: e.target.value }))}
                        style={inputStyle}
                        onFocus={e => (e.currentTarget.style.borderBottomColor = "#3a1335")}
                        onBlur={e => (e.currentTarget.style.borderBottomColor = "#d2c2cb")}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>Correo Electrónico</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                      style={inputStyle}
                      onFocus={e => (e.currentTarget.style.borderBottomColor = "#3a1335")}
                      onBlur={e => (e.currentTarget.style.borderBottomColor = "#d2c2cb")}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Mensaje / Requerimiento</label>
                    <textarea
                      rows={4}
                      value={formData.mensaje}
                      onChange={e => setFormData(p => ({ ...p, mensaje: e.target.value }))}
                      style={{ ...inputStyle, resize: "none" }}
                      onFocus={e => (e.currentTarget.style.borderBottomColor = "#3a1335")}
                      onBlur={e => (e.currentTarget.style.borderBottomColor = "#d2c2cb")}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={sending}
                    style={{
                      background: sending ? "#80747b" : "#3a1335",
                      color: "white", width: "100%",
                      padding: "20px", borderRadius: "12px",
                      fontWeight: 700, textTransform: "uppercase",
                      letterSpacing: "0.2em", fontSize: "12px",
                      border: "none", cursor: sending ? "not-allowed" : "pointer",
                      transition: "opacity 150ms ease",
                    }}
                    onMouseEnter={e => { if (!sending) e.currentTarget.style.opacity = "0.9"; }}
                    onMouseLeave={e => { if (!sending) e.currentTarget.style.opacity = "1"; }}
                  >
                    {sending ? "Enviando…" : "Enviar Solicitud de Asesoría"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ════ FOOTER ════════════════════════════════════════════════════════ */}
      <footer style={{
        background: "#3a1335", color: "white",
        paddingTop: "96px", paddingBottom: "48px",
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 32px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "48px", marginBottom: "64px" }} className="footer-grid">

            {/* Col 1 — Brand */}
            <div>
              <img
                src="/images/logo.png"
                alt="Cabal Logo"
                style={{ filter: "brightness(0) invert(1)", height: "64px", width: "auto", marginBottom: "32px", display: "block" }}
              />
              <p style={{ color: "rgba(255,255,255,0.60)", fontSize: "14px", lineHeight: 1.7, marginBottom: "24px", maxWidth: "240px" }}>
                Corretaje independiente de seguros con más de 20 años protegiendo empresas y familias venezolanas.
              </p>
              <div style={{ display: "flex", gap: "12px" }}>
                {["in", "tw"].map(icon => (
                  <a key={icon} href="#" style={{
                    width: "40px", height: "40px", borderRadius: "9999px",
                    border: "1px solid rgba(255,255,255,0.20)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "white", textDecoration: "none",
                    fontSize: "12px", fontWeight: 700,
                    transition: "background 200ms ease",
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = "white"; e.currentTarget.style.color = "#3a1335"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "white"; }}
                  >{icon.toUpperCase()}</a>
                ))}
              </div>
            </div>

            {/* Col 2 — Services */}
            <div>
              <h4 style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "18px", fontWeight: 700, marginBottom: "24px" }}>
                Servicios
              </h4>
              {["Seguros de Salud (HCM)", "Seguros de Automóvil", "Riesgos Patrimoniales", "Fianzas y Garantías"].map(l => (
                <a key={l} href="#ramos" style={{
                  display: "block", color: "rgba(255,255,255,0.60)",
                  fontSize: "14px", textDecoration: "none",
                  marginBottom: "12px", transition: "color 150ms ease",
                }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#ffd7f3")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.60)")}
                >{l}</a>
              ))}
            </div>

            {/* Col 3 — Institutional */}
            <div>
              <h4 style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "18px", fontWeight: 700, marginBottom: "24px" }}>
                Institucional
              </h4>
              {["Registro SUDEASEG", "Aseguradoras Aliadas", "Políticas de Privacidad", "Gobierno Corporativo"].map(l => (
                <a key={l} href="#nosotros" style={{
                  display: "block", color: "rgba(255,255,255,0.60)",
                  fontSize: "14px", textDecoration: "none",
                  marginBottom: "12px", transition: "color 150ms ease",
                }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#ffd7f3")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.60)")}
                >{l}</a>
              ))}
            </div>

            {/* Col 4 — Location */}
            <div>
              <h4 style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "18px", fontWeight: 700, marginBottom: "24px" }}>
                Sede Principal
              </h4>
              <p style={{ color: "rgba(255,255,255,0.60)", fontSize: "14px", lineHeight: 1.7, marginBottom: "16px" }}>
                Caracas, Venezuela<br />
                RIF: J-405144750
              </p>
              {/* Map placeholder */}
              <div style={{
                border: "1px solid rgba(255,255,255,0.10)",
                borderRadius: "8px",
                aspectRatio: "16/9",
                background: "rgba(255,255,255,0.04)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "rgba(255,255,255,0.30)", fontSize: "12px",
              }}>
                Ver en mapa
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div style={{
            borderTop: "1px solid rgba(255,255,255,0.10)",
            paddingTop: "48px",
            display: "flex", justifyContent: "space-between",
            alignItems: "center", flexWrap: "wrap", gap: "24px",
            fontSize: "10px", fontWeight: 700,
            textTransform: "uppercase", letterSpacing: "0.2em",
            color: "rgba(255,255,255,0.40)",
          }}>
            <span>© 2024 CABAL CORRETAJE DE SEGUROS. TODOS LOS DERECHOS RESERVADOS.</span>
            <span>RIF: J-405144750 | SUDEASEG: SCSMP-000002</span>
          </div>
        </div>
      </footer>

      {/* WhatsApp float */}
      <WhatsAppBtn />

      {/* ─── Global styles + Responsive ─── */}
      <style>{`
        @keyframes whatsappPulse {
          0%   { transform: scale(1);   opacity: 0.7; }
          65%  { transform: scale(1.7); opacity: 0; }
          100% { transform: scale(1.7); opacity: 0; }
        }

        @media (max-width: 1024px) {
          .planes-grid    { grid-template-columns: 1fr 1fr !important; }
          .footer-grid    { grid-template-columns: 1fr 1fr !important; gap: 32px !important; }
        }

        @media (max-width: 900px) {
          .hero-grid         { grid-template-columns: 1fr !important; gap: 48px !important; }
          .hero-right        { display: none !important; }
          .excelencia-grid   { grid-template-columns: 1fr !important; gap: 44px !important; }
        }

        @media (max-width: 768px) {
          .stats-grid          { grid-template-columns: 1fr 1fr !important; }
          .ramos-grid          { grid-template-columns: 1fr !important; }
          .contacto-grid-main  { grid-template-columns: 1fr !important; gap: 40px !important; }
          .planes-grid         { grid-template-columns: 1fr !important; }
          .nav-desktop         { display: none !important; }
          .nav-mobile          { display: block !important; }
        }

        @media (max-width: 480px) {
          .footer-grid { grid-template-columns: 1fr !important; }
          .stats-grid  { grid-template-columns: 1fr 1fr !important; }
        }

        @media (prefers-reduced-motion: reduce) {
          * { transition-duration: 50ms !important; animation-duration: 50ms !important; }
        }

        select option { color: #1f1a1d; }
        ::placeholder { color: #80747b; }
      `}</style>
    </div>
  );
}
