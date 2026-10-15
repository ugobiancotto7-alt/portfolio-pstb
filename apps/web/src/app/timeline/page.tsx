/**
 * Timeline : l'API renvoie une liste plate triée par date ; on la regroupe
 * ici par mois ("2026-10") avec un simple Map.
 */
import type { Metadata } from "next";
import Link from "next/link";
import type { TimelineEntry, TimelineKind } from "@pstb/shared";
import { Container } from "@/components/Container";
import { PageHeader } from "@/components/PageHeader";
import { api } from "@/lib/api";
import { formatDate, formatMonth } from "@/lib/format";

export const metadata: Metadata = { title: "Timeline" };

const KIND_LABELS: Record<TimelineKind, string> = {
  event: "Événement",
  article: "Article",
  project: "Projet",
  milestone: "Étape",
};

/** Où mène chaque entrée quand on clique dessus. */
function hrefFor(entry: TimelineEntry) {
  if (!entry.slug) return null;
  if (entry.kind === "article") return `/articles/${entry.slug}`;
  if (entry.kind === "project") return `/projets/${entry.slug}`;
  return null;
}

export default async function TimelinePage() {
  const entries = await api.timeline();

  const byMonth = new Map<string, TimelineEntry[]>();
  for (const entry of entries) {
    const month = entry.date.slice(0, 7);
    byMonth.set(month, [...(byMonth.get(month) ?? []), entry]);
  }

  return (
    <Container>
      <PageHeader n="02" label="Timeline" title="Timeline">
        Notre progression, mois par mois.
      </PageHeader>
      {entries.length === 0 && <p className="mt-10 text-muted">Rien pour l&apos;instant.</p>}

      <ol className="mt-4">
        {[...byMonth.entries()].map(([month, items]) => (
          // Une ligne par mois : le mois à gauche, les entrées à droite
          <li key={month} className="grid gap-6 border-b border-border py-12 md:grid-cols-[260px_1fr]">
            <h2 className="font-display text-4xl leading-none md:sticky md:top-28 md:self-start">{formatMonth(month)}</h2>
            <ul className="divide-y divide-border">
              {items.map((entry, i) => {
                const href = hrefFor(entry);
                const body = (
                  <div className="grid grid-cols-[2.5rem_1fr] gap-4 py-5 first:pt-0">
                    <span className="font-display text-2xl italic text-muted">{String(i + 1).padStart(2, "0")}</span>
                    <div>
                      <p className="eyebrow">
                        {KIND_LABELS[entry.kind]} · {formatDate(entry.date)}
                      </p>
                      <p className="mt-2 text-xl font-semibold">{entry.title}</p>
                      {entry.summary && <p className="mt-1 text-sm leading-6 text-muted">{entry.summary}</p>}
                    </div>
                  </div>
                );
                return (
                  <li key={`${entry.kind}-${entry.id}`}>
                    {href ? (
                      <Link href={href} className="block transition hover:opacity-70">
                        {body}
                      </Link>
                    ) : (
                      body
                    )}
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ol>
    </Container>
  );
}
