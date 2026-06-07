"use client";

import { useState } from "react";
import Image from "next/image";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        backgroundColor: "#fff7f9",
        fontFamily: "var(--font-inter, var(--font-body, system-ui))",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          display: "flex",
          flexDirection: "column",
          gap: "28px",
        }}
      >
        {/* Logo */}
        <a href="/" style={{ display: "flex", justifyContent: "center", textDecoration: "none" }}>
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "8px",
              padding: "6px 14px",
              boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
            }}
          >
            <Image
              src="/logos/logo-cabal.png"
              alt="Cabal Corretaje de Seguros"
              width={110}
              height={44}
              style={{ objectFit: "contain", display: "block" }}
            />
          </div>
        </a>

        {/* Card */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "8px",
            border: "1px solid #d2c2cb",
            padding: "36px 32px",
            boxShadow: "0px 10px 40px rgba(58, 19, 53, 0.06)",
          }}
        >
          <h1
            style={{
              fontFamily: "var(--font-playfair, var(--font-display, Georgia, serif))",
              fontSize: "24px",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "#3A1335",
              marginBottom: "6px",
            }}
          >
            Iniciar sesión
          </h1>
          <p style={{ fontSize: "14px", color: "#4e444b", marginBottom: "28px", lineHeight: 1.5 }}>
            Accedé a tu cuenta de Cabal Asesores.
          </p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{
                fontSize: "11px", fontWeight: 600, color: "#3A1335",
                letterSpacing: "0.10em", textTransform: "uppercase",
              }}>
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@empresa.com"
                required
                style={{
                  width: "100%",
                  padding: "10px 0",
                  background: "transparent",
                  border: "none",
                  borderBottom: "1.5px solid #d2c2cb",
                  color: "#1f1a1d",
                  fontSize: "14px",
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 200ms ease",
                }}
                onFocus={(e) => { e.currentTarget.style.borderBottomColor = "#3A1335"; e.currentTarget.style.borderBottomWidth = "2px"; }}
                onBlur={(e) => { e.currentTarget.style.borderBottomColor = "#d2c2cb"; e.currentTarget.style.borderBottomWidth = "1.5px"; }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{
                fontSize: "11px", fontWeight: 600, color: "#3A1335",
                letterSpacing: "0.10em", textTransform: "uppercase",
              }}>
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: "100%",
                  padding: "10px 0",
                  background: "transparent",
                  border: "none",
                  borderBottom: "1.5px solid #d2c2cb",
                  color: "#1f1a1d",
                  fontSize: "14px",
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 200ms ease",
                }}
                onFocus={(e) => { e.currentTarget.style.borderBottomColor = "#3A1335"; e.currentTarget.style.borderBottomWidth = "2px"; }}
                onBlur={(e) => { e.currentTarget.style.borderBottomColor = "#d2c2cb"; e.currentTarget.style.borderBottomWidth = "1.5px"; }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "4px",
                border: "none",
                backgroundColor: loading ? "#d2c2cb" : "#3A1335",
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                transition: "background-color 140ms ease, transform 140ms ease",
                marginTop: "4px",
              }}
              onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.backgroundColor = "#5A1D4F"; e.currentTarget.style.transform = "translateY(-1px)"; } }}
              onMouseLeave={(e) => { if (!loading) { e.currentTarget.style.backgroundColor = "#3A1335"; e.currentTarget.style.transform = "translateY(0)"; } }}
              onMouseDown={(e) => { if (!loading) e.currentTarget.style.transform = "scale(0.97)"; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
            >
              {loading ? "Verificando…" : "Ingresar"}
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", fontSize: "12px", color: "#7A7A8A" }}>
          ¿No tenés cuenta?{" "}
          <a href="mailto:central@cabalasesores.com" style={{ color: "#3A1335", fontWeight: 600, textDecoration: "none" }}>
            Contactanos
          </a>
        </p>
      </div>

      <style>{`
        input::placeholder { color: #80747b; }
      `}</style>
    </div>
  );
}
