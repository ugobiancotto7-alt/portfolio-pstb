"use client";
/**
 * next-themes mémorise le choix clair/sombre (localStorage). Par défaut,
 * le site s'ouvre en sombre (le style "IA"). "use client" : ce composant
 * tourne dans le navigateur, car il a besoin de localStorage.
 */
import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      {children}
    </NextThemesProvider>
  );
}
