import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { api } from "@/lib/api";

export const metadata: Metadata = { title: "Projets" };

export default async function ProjectsPage() {
  const projects = await api.projects();
  return (
    <>
      <PageHeader title="Projets">Nos projets Data &amp; IA : contexte, technologies et résultats.</PageHeader>
      {projects.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-border p-10 text-center text-muted">
          Les premiers projets arrivent bientôt.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {projects.map((p) => (
            <article key={p.id} className="rounded-2xl border border-border bg-surface p-6">
              <h2 className="text-lg font-bold">{p.title}</h2>
              <p className="mt-2 text-sm text-muted">{p.summary}</p>
              <ul className="mt-4 flex flex-wrap gap-1.5">
                {p.technologies.map((t) => (
                  <li key={t.id} className="rounded-full bg-brand-500/10 px-2.5 py-1 text-xs font-medium">
                    {t.name}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
