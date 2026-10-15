/**
 * Layout racine : enveloppe TOUTES les pages (en-tête, pied de page, thème).
 * Dans le dossier "app" de Next.js, chaque dossier = une URL :
 *   app/page.tsx              -> /
 *   app/equipe/page.tsx       -> /equipe
 *   app/articles/[slug]/…     -> /articles/n-importe-quel-slug
 *
 * Chaque page gère sa propre largeur avec <Container>, ce qui permet à
 * l'accueil d'avoir une grande photo sur toute la largeur de l'écran.
 */
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Ugo, Tim & Marcelo · Data & IA à la PSTB", template: "%s · PSTB Data & IA" },
  description: "Le journal de bord de trois étudiants en Bachelor Data & IA à la Paris School of Technology & Business.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // suppressHydrationWarning : next-themes ajoute la classe "dark" avant React, c'est voulu.
    <html lang="fr" suppressHydrationWarning>
      <head>
        {/* Polices : Instrument Serif pour les titres, Manrope pour le texte */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Manrope:wght@400;500;600;700&display=swap"
        />
      </head>
      <body className="min-h-screen font-sans antialiased">
        <ThemeProvider>
          <Header />
          <main>{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
