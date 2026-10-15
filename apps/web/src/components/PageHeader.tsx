import type { ReactNode } from "react";

/** En-tête des pages intérieures : numéro, grand titre serif, chapeau. */
export function PageHeader({ n, label, title, children }: { n: string; label: string; title: string; children?: ReactNode }) {
  return (
    <div className="border-b border-border pb-10 pt-14 sm:pt-20">
      <p className="eyebrow">
        {n} — {label}
      </p>
      <h1 className="mt-4 font-display text-6xl leading-[0.95] sm:text-8xl">{title}</h1>
      {children && <p className="mt-6 max-w-2xl text-lg text-muted">{children}</p>}
    </div>
  );
}
