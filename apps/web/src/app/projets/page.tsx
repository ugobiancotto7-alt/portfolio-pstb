import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/Container";
import { PageHeader } from "@/components/PageHeader";
import { Starfield } from "@/components/Starfield";
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
        // En attendant les projets : un petit système en orbite, sur fond d'espace
        <div
          data-reveal
          className="dark relative mt-14 overflow-hidden rounded-3xl border border-border bg-bg px-6 py-20 text-center text-fg"
        >
          <Starfield />
          <div className="relative mx-auto mb-10 size-40" aria-hidden>
            <div className="absolute inset-[34%] rounded-full bg-[radial-gradient(circle_at_30%_30%,var(--accent),#0b0e22_70%)] shadow-[0_0_60px_var(--glow)]" />
            {[
              { inset: "inset-[14%]", speed: "9s", dot: "bg-cyan" },
              { inset: "inset-0", speed: "16s", dot: "bg-brand-500" },
            ].map((ring) => (
              <div key={ring.speed} className={`orbit-ring absolute ${ring.inset}`}>
                <span
                  className="absolute inset-0 rounded-full border border-brand-500/35"
                  style={{ "--speed": ring.speed } as CSSProperties}
                >
                  <span
                    className={`absolute -top-1 left-1/2 size-2 -translate-x-1/2 rounded-full ${ring.dot} shadow-[0_0_12px_currentColor]`}
                  />
                </span>
              </div>
            ))}
          </div>
          <p className="relative font-mono text-xs text-cyan">// status: en préparation</p>
          <p className="relative mt-3 font-display text-3xl sm:text-4xl">Les premiers projets arrivent bientôt.</p>
          <p className="relative mx-auto mt-3 max-w-md text-sm text-muted">
            Ils seront ajoutés depuis l&apos;espace admin au fil de l&apos;année. En attendant, suivez notre progression
            sur la timeline.
          </p>
          <Link
            href="/timeline"
            className="relative mt-8 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-on-ink transition hover:opacity-90"
          >
            Ouvrir la timeline <ArrowRight className="size-4" />
          </Link>
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
