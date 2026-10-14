import type { Metadata } from "next";
import Link from "next/link";
import { EnvBanner } from "@/components/sc/env-banner";

export const metadata: Metadata = {
  title: "Acceso restringido",
  robots: { index: false, follow: false },
};

export default function AccesoRestringido() {
  return (
    <div style={{ minHeight: "100dvh", backgroundColor: "#fff7f9" }}>
      <EnvBanner />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "70dvh", padding: "40px 24px" }}>
        <div style={{ maxWidth: 520, textAlign: "center" }}>
          <h1 style={{ fontFamily: "var(--font-display, Georgia, serif)", fontSize: 24, fontWeight: 700, color: "#3A1335", marginBottom: 12 }}>
            Módulo de emisión — acceso restringido
          </h1>
          <p style={{ fontSize: 14, color: "#7a6d74", lineHeight: 1.6 }}>
            Este módulo está en fase de pruebas con Seguros Caracas y solo es accesible mediante el enlace privado
            enviado a los equipos autorizados. Si necesita acceso, contacte a Cabal Corretaje de Seguros.
          </p>
          <Link href="/" style={{ display: "inline-block", marginTop: 24, padding: "10px 24px", borderRadius: 4, backgroundColor: "#3A1335", color: "#fff", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
