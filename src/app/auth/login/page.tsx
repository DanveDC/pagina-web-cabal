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
        backgroundColor: "#FAFAF9",
        fontFamily: "var(--font-sans, system-ui)",
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
            borderRadius: "16px",
            border: "1px solid rgba(58,19,53,0.09)",
            padding: "32px",
            boxShadow: "0 4px 24px rgba(58,19,53,0.06)",
          }}
        >
          <h1
            style={{
              fontSize: "20px",
              fontWeight: 800,
              letterSpacing: "-0.4px",
              color: "#3A1335",
              marginBottom: "6px",
            }}
          >
            Iniciar sesión
          </h1>
          <p style={{ fontSize: "13.5px", color: "#4A464A", marginBottom: "24px" }}>
            Accedé a tu cuenta de Cabal Asesores.
          </p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#3A1335" }}>
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
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: "1.5px solid rgba(58,19,53,0.14)",
                  backgroundColor: "#FFFFFF",
                  color: "#3A1335",
                  fontSize: "13.5px",
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 150ms ease",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#3A1335")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(58,19,53,0.14)")}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#3A1335" }}>
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
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: "1.5px solid rgba(58,19,53,0.14)",
                  backgroundColor: "#FFFFFF",
                  color: "#3A1335",
                  fontSize: "13.5px",
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 150ms ease",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#3A1335")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(58,19,53,0.14)")}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "12px",
                border: "none",
                backgroundColor: loading ? "#C4B8D8" : "#3A1335",
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                transition: "background-color 140ms ease, transform 100ms ease",
                marginTop: "4px",
              }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.backgroundColor = "#5A1D4F"; }}
              onMouseLeave={(e) => { if (!loading) e.currentTarget.style.backgroundColor = "#3A1335"; }}
              onMouseDown={(e) => { if (!loading) e.currentTarget.style.transform = "scale(0.98)"; }}
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
        input::placeholder { color: #B0A8C8; }
      `}</style>
    </div>
  );
}
