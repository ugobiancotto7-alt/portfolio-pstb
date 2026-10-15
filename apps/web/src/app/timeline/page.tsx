/**
 * Timeline : l'API renvoie une liste plate triée par date ; on la regroupe
 * ici par mois ("2026-10") avec un simple Map.
 */
import type { Metadata } from "next";
import Link from "next/link";
import type { TimelineEntry, TimelineKind } from "@pstb/shared";
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
    <>
      <PageHeader title="Timeline">Notre progression, mois par mois.</PageHeader>
      {entries.length === 0 && <p className="text-muted">Rien pour l&apos;instant.</p>}

      <ol className="relative space-y-12 border-l border-border pl-6 sm:pl-8">
        {[...byMonth.entries()].map(([month, items]) => (
          <li key={month}>
            <span className="absolute -left-[7px] mt-1.5 size-3.5 rounded-full border-2 border-bg bg-brand-500" aria-hidden />
            <h2 className="text-lg font-bold">{formatMonth(month)}</h2>
            <ul className="mt-4 space-y-3">
              {items.map((entry) => {
                const href = hrefFor(entry);
                const body = (
                  <>
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">
                      {KIND_LABELS[entry.kind]} · {formatDate(entry.date)}
                    </p>
                    <p className="mt-1 font-semibold">{entry.title}</p>
                    {entry.summary && <p className="mt-1 text-sm text-muted">{entry.summary}</p>}
                  </>
                );
                const cls = "block rounded-xl border border-border bg-surface p-4";
                return (
                  <li key={`${entry.kind}-${entry.id}`}>
                    {href ? (
                      <Link href={href} className={`${cls} transition hover:border-brand-500/50`}>
                        {body}
                      </Link>
                    ) : (
                      <div className={cls}>{body}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ol>
    </>
  );
}
