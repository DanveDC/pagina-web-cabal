import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Cabal Corretaje de Seguros",
    template: "%s | Cabal Corretaje",
  },
  description:
    "Corretaje de seguros corporativo en Caracas. Cotizaciones empresariales de Automóvil, Salud, Hogar y Patrimoniales.",
  keywords: ["seguros", "corretaje", "cotización", "empresarial", "Caracas", "Venezuela"],
  openGraph: {
    type: "website",
    locale: "es_VE",
    url: "https://cabalasesores.com",
    siteName: "Cabal Corretaje de Seguros, C.A.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="min-h-dvh antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
