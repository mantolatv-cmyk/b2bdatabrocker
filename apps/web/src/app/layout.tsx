import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Atlas Intelligence — Terminal de Inteligência B2B",
  description:
    "Plataforma de inteligência competitiva que coleta, analisa e entrega insights acionáveis para decisões empresariais de alto nível.",
  keywords: ["inteligência competitiva", "B2B", "data broker", "insights", "IA"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`dark ${sans.variable} ${mono.variable} ${display.variable}`}>
      <body className="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
