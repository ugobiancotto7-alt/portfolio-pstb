import type { ReactNode } from "react";

/** Largeur maximale + marges latérales, partagées par toutes les sections. */
export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-6xl px-4 sm:px-6 ${className}`}>{children}</div>;
}
