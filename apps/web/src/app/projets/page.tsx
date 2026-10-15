import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { PageHeader } from "@/components/PageHeader";
import { api } from "@/lib/api";

export const metadata: Metadata = { title: "Projets" };

export default async function ProjectsPage() {
  const projects = await api.projects();
  return (
    <Container>
      <PageHeader n="04" label="Projets" title="Projets">
        Nos projets Data &amp; IA : contexte, technologies et résultats.
      </PageHeader>
      {projects.length === 0 ? (
        <div className="glass mt-14 rounded-2xl border-dashed px-6 py-16 text-center">
          <p className="font-mono text-xs text-cyan">// status: en préparation</p>
          <p className="mt-3 font-display text-3xl">Les premiers projets arrivent bientôt.</p>
          <p className="mt-3 text-sm text-muted">
            Ils seront ajoutés depuis l&apos;espace admin au fil de l&apos;année.
          </p>
        </div>
      ) : (
        <div className="mt-14 grid gap-x-6 gap-y-12 sm:grid-cols-2">
          {projects.map((p, i) => (
            <article key={p.id} className="border-t border-border pt-6">
              <p className="eyebrow">{String(i + 1).padStart(2, "0")}</p>
              <h2 className="mt-2 font-display text-4xl">{p.title}</h2>
              <p className="mt-3 text-sm leading-6 text-muted">{p.summary}</p>
              <ul className="mt-4 flex flex-wrap gap-1.5">
                {p.technologies.map((t) => (
                  <li key={t.id} className="rounded-full border border-border px-3 py-1 text-xs">
                    {t.name}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      )}
    </Container>
  );
}
