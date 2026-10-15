"use client";
/**
 * Branche les interactions de lib/enhance.ts sur la page affichée.
 * usePathname change à chaque navigation : on relance alors enhance()
 * pour les nouveaux éléments (sphère 3D, cartes inclinables…).
 */
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { enhance } from "@/lib/enhance";

export function Enhancer() {
  const pathname = usePathname();
  useEffect(() => {
    enhance();
  }, [pathname]);
  return null;
}
