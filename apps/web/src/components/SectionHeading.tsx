import type { ReactNode } from "react";

/** Titre de section avec son numéro : "02 — L'équipe". */
export function SectionHeading({
  n,
  label,
  title,
  children,
}: {
  n: string;
  label: string;
  title: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="mb-10 grid gap-4 md:grid-cols-[1fr_1fr] md:items-end">
      <div>
        <p className="eyebrow">
          // {n} · {label}
        </p>
        <h2 className="mt-3 font-display text-4xl leading-[1.05] sm:text-5xl">{title}</h2>
      </div>
      {children && <p className="max-w-md text-muted md:justify-self-end">{children}</p>}
    </div>
  );
}
