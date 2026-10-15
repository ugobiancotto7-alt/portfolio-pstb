"use client";
/**
 * next-themes mémorise le choix clair/sombre (localStorage) et suit par
 * défaut le réglage du système. "use client" : ce composant tourne dans
 * le navigateur, car il a besoin de localStorage.
 */
import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
    </NextThemesProvider>
  );
}
