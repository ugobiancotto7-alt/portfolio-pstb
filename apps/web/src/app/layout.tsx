/**
 * Layout racine : enveloppe TOUTES les pages (en-tête, pied de page, thème).
 * Dans le dossier "app" de Next.js, chaque dossier = une URL :
 *   app/page.tsx              -> /
 *   app/equipe/page.tsx       -> /equipe
 *   app/articles/[slug]/…     -> /articles/n-importe-quel-slug
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
      <body className="min-h-screen antialiased">
        <ThemeProvider>
          <Header />
          <main className="mx-auto max-w-5xl px-4 pt-10 sm:pt-16">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
