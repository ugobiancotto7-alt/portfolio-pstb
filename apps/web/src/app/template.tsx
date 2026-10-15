/**
 * template.tsx ressemble à layout.tsx, avec une différence : il est recréé à
 * chaque changement de page. Son animation CSS (.page-enter) rejoue donc à
 * chaque navigation : la nouvelle page arrive en fondu léger.
 */
import type { ReactNode } from "react";

export default function Template({ children }: { children: ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
