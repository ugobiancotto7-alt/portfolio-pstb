import type { ReactNode } from "react";

export function PageHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="mb-10">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
      {children && <p className="mt-3 max-w-2xl text-muted">{children}</p>}
    </div>
  );
}
