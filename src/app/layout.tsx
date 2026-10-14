import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-playfair",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

// The CSP in src/proxy.ts uses a per-request nonce + 'strict-dynamic'. Next.js
// can only stamp that nonce on its <script> tags when the page is rendered per
// request; prerendered (static) HTML carries no nonce and the browser blocks
// every script, leaving the site non-interactive. Render all routes dynamically.
export const dynamic = "force-dynamic";

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
    <html lang="es" className={`${playfair.variable} ${inter.variable}`} suppressHydrationWarning>
      <body
        className="min-h-dvh antialiased"
        style={{ fontFamily: "var(--font-inter, var(--font-body, system-ui))" }}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
