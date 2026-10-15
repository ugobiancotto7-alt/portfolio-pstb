import type { ReactNode } from "react";

/** En-tête des pages intérieures : numéro, grand titre serif, chapeau. */
export function PageHeader({
  n,
  label,
  title,
  children,
}: {
  n: string;
  label: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="relative border-b border-border pb-10 pt-14 sm:pt-20">
      <div
        className="pointer-events-none absolute -left-32 -top-10 size-80 rounded-full bg-brand-500/15 blur-3xl"
        aria-hidden
      />
      <p className="eyebrow relative">
        // {n} · {label}
      </p>
      <h1 className="relative mt-4 font-display text-5xl leading-[1] sm:text-7xl">{title}</h1>
      {children && <p className="mt-6 max-w-2xl text-lg text-muted">{children}</p>}
    </div>
  );
}
