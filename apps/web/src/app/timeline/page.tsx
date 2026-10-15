/**
 * Timeline : notre année racontée en trois temps.
 *   1. L'orbite : l'année scolaire vue comme un tour autour du soleil (canvas 3D,
 *      lib/effects/timeline.ts). On peut la faire tourner et cliquer sur un mois.
 *   2. La barre des mois, qui reste collée en haut et suit la lecture.
 *   3. La frise verticale : les cartes pivotent en 3D selon leur position
 *      à l'écran et la ligne centrale se remplit pendant le défilement.
 *
 * L'API renvoie une liste plate triée de la plus récente à la plus ancienne.
 * On la remet ici dans l'ordre chronologique (on raconte l'année dans
 * l'ordre), puis on regroupe par mois ("2026-10") avec un simple Map.
 */
import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, FileText, Flag, FlaskConical, type LucideIcon } from "lucide-react";
import type { TimelineEntry, TimelineKind } from "@pstb/shared";
import { Container } from "@/components/Container";
import { PageHeader } from "@/components/PageHeader";
import { Starfield } from "@/components/Starfield";
import { api } from "@/lib/api";
import type { OrbitData } from "@/lib/effects/timeline";
import { formatDate, formatMonth } from "@/lib/format";
import { schoolYear } from "@/lib/year";

export const metadata: Metadata = { title: "Timeline" };

const pad = (n: number) => String(n).padStart(2, "0");

/** Apparence de chaque type d'entrée. `order` : dans une même journée, l'événement d'abord, l'article ensuite. */
const KINDS: Record<TimelineKind, { label: string; plural: string; icon: LucideIcon; dot: string; order: number }> = {
  event: { label: "Événement", plural: "Événements", icon: CalendarDays, dot: "bg-cyan", order: 0 },
  project: { label: "Projet", plural: "Projets", icon: FlaskConical, dot: "bg-emerald-400", order: 1 },
  article: { label: "Article", plural: "Articles", icon: FileText, dot: "bg-brand-500", order: 2 },
  milestone: { label: "Étape", plural: "Étapes", icon: Flag, dot: "bg-amber-400", order: 3 },
};

/** Où mène chaque entrée, et le texte du lien. Un événement mène à son compte rendu. */
function linkFor(entry: TimelineEntry): { href: string; label: string } | null {
  if (entry.kind === "project" && entry.slug) return { href: `/projets/${entry.slug}`, label: "Voir le projet" };
  if (entry.kind === "article" && entry.slug) return { href: `/articles/${entry.slug}`, label: "Lire l'article" };
  if (entry.kind === "event" && entry.articleSlug)
    return { href: `/articles/${entry.articleSlug}`, label: "Lire le compte rendu" };
  return null;
}

export default async function TimelinePage() {
  const entries = await api.timeline();
  const year = schoolYear();

  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date) || KINDS[a.kind].order - KINDS[b.kind].order);
  const byMonth = new Map<string, TimelineEntry[]>();
  for (const entry of sorted) {
    const month = entry.date.slice(0, 7);
    byMonth.set(month, [...(byMonth.get(month) ?? []), entry]);
  }

  // Ce que le canvas de l'orbite a besoin de savoir, passé en JSON
  const orbit: OrbitData = {
    months: year.months.map((m) => ({
      short: m.short.replace(".", "").toUpperCase(),
      long: m.long,
      count: byMonth.get(m.key)?.length ?? 0,
      anchor: byMonth.has(m.key) ? `mois-${m.key}` : null,
      future: m.future,
    })),
    progress: year.progress,
    todayLabel: formatDate(year.todayIso),
  };
  const inYear = sorted.filter((e) => year.months.some((m) => e.date.startsWith(m.key)));
  const totals = (Object.keys(KINDS) as TimelineKind[]).map((kind) => ({
    kind,
    count: inYear.filter((e) => e.kind === kind).length,
  }));
  const next = year.months[year.currentIndex + 1];

  let side = -1; // les cartes alternent à gauche et à droite de la ligne (sur ordinateur)

  return (
    <Container>
      <PageHeader n="02" label="Timeline" title="Timeline">
        Notre année vue comme une orbite : chaque mois est une étape du voyage. Faites-la tourner, puis descendez pour
        revivre chaque moment.
      </PageHeader>

      {/* 1. L'ORBITE DE L'ANNÉE (toujours sur fond d'espace, même en thème clair) */}
      <section
        aria-label={`Orbite de l'année ${year.label}`}
        className="dark relative mt-10 overflow-hidden rounded-3xl border border-border bg-bg text-fg"
      >
        <div
          className="pointer-events-none absolute -left-24 -top-24 size-96 rounded-full bg-brand-500/20 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-32 right-0 size-96 rounded-full bg-cyan/10 blur-3xl"
          aria-hidden
        />
        <Starfield />
        <canvas
          data-orbit={JSON.stringify(orbit)}
          className="relative block h-[400px] w-full cursor-grab touch-pan-y sm:h-[480px]"
          aria-label="L'année scolaire en 3D : les douze mois en orbite autour d'un soleil, et une comète qui marque aujourd'hui"
        />
        <div className="pointer-events-none absolute left-5 top-5 sm:left-8 sm:top-8">
          <p className="eyebrow">// orbite {year.label}</p>
          <p className="mt-2 font-display text-3xl sm:text-4xl">
            Mois {pad(year.currentIndex + 1)}
            <span className="text-muted">/12</span>
          </p>
          <p className="mt-1 text-sm text-muted">{Math.round(year.progress * 100)} % de l&apos;année parcourue</p>
          <dl className="mt-6 hidden space-y-2 sm:block">
            {totals.map(({ kind, count }) => (
              <div key={kind} className="flex items-center gap-3 text-sm">
                <span className={`size-2 rounded-full ${KINDS[kind].dot}`} aria-hidden />
                <dt className="w-24 text-muted">{KINDS[kind].plural}</dt>
                <dd className="font-mono tabular-nums">{pad(count)}</dd>
              </div>
            ))}
          </dl>
        </div>
        <p className="pointer-events-none absolute bottom-4 right-5 hidden font-mono text-[10px] uppercase tracking-wider text-muted sm:block">
          Glisser pour faire tourner · cliquer sur un mois
        </p>
      </section>

      {/* 2. LA BARRE DES MOIS : reste en haut de l'écran et suit la lecture */}
      <nav data-month-nav aria-label="Mois de l'année" className="sticky top-[72px] z-30 mt-6">
        <div className="rounded-full border border-border bg-bg/85 p-1 shadow-[0_12px_40px_-20px_var(--glow)] backdrop-blur-xl">
          <div data-month-scroller className="no-scrollbar relative flex overflow-x-auto">
            <span
              data-month-pill
              aria-hidden
              className="absolute left-0 top-0 h-full rounded-full bg-brand-500/15 opacity-0 ring-1 ring-brand-500/40 transition-all duration-500 ease-out"
            />
            {year.months.map((m) => {
              const count = byMonth.get(m.key)?.length ?? 0;
              const label = (
                <>
                  {m.short.replace(".", "")}
                  {m.current && (
                    <span className="absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full bg-cyan" />
                  )}
                </>
              );
              const base =
                "relative z-10 shrink-0 rounded-full px-3.5 py-2 text-center font-mono text-[11px] uppercase tracking-wider sm:flex-1 sm:px-1";
              return count > 0 ? (
                <a
                  key={m.key}
                  href={`#mois-${m.key}`}
                  data-month
                  data-scroll-to
                  className={`${base} text-fg transition hover:text-cyan aria-[current=true]:text-cyan`}
                >
                  {label}
                  <sup className="ml-0.5 text-[9px] text-cyan">{count}</sup>
                </a>
              ) : (
                <span key={m.key} className={`${base} ${m.future ? "text-muted/40" : "text-muted"}`}>
                  {label}
                </span>
              );
            })}
          </div>
        </div>
      </nav>

      {/* 3. LA FRISE VERTICALE */}
      {sorted.length === 0 ? (
        <p className="mt-16 text-muted">Rien pour l&apos;instant : la première entrée arrive bientôt.</p>
      ) : (
        <div data-timeline className="relative mt-6 pb-6">
          {/* La ligne, et sa partie lumineuse qui se remplit pendant le défilement */}
          <div aria-hidden className="absolute inset-y-0 left-5 w-px bg-border md:left-1/2" />
          <div
            aria-hidden
            data-tl-fill
            style={{ transform: "scaleY(0)" }}
            className="absolute inset-y-0 left-5 w-px origin-top bg-gradient-to-b from-brand-500 via-cyan to-cyan shadow-[0_0_14px_var(--accent-2)] md:left-1/2"
          />

          {[...byMonth.entries()].map(([month, items]) => (
            <section key={month} id={`mois-${month}`} data-month-section className="relative scroll-mt-40">
              {/* En-tête du mois, posé sur la ligne, avec un grand numéro en contour derrière */}
              <div className="relative flex items-center py-12 pl-12 md:justify-center md:pl-0">
                <span
                  aria-hidden
                  className="text-outline pointer-events-none absolute left-16 top-1/2 -translate-y-1/2 select-none font-display text-[7rem] leading-none md:left-1/2 md:-translate-x-1/2 md:text-[11rem]"
                >
                  {month.slice(5)}
                </span>
                <h2 className="glass relative rounded-full px-5 py-2 font-display text-xl sm:text-2xl">
                  {formatMonth(month)}
                  <span className="ml-2 font-mono text-xs text-muted">
                    · {items.length} entrée{items.length > 1 ? "s" : ""}
                  </span>
                </h2>
              </div>

              <ol className="space-y-10 md:space-y-4">
                {items.map((entry) => {
                  side = -side;
                  const kind = KINDS[entry.kind];
                  const Icon = kind.icon;
                  const link = linkFor(entry);
                  const card = (
                    <>
                      {entry.coverUrl && (
                        <div className="relative aspect-[16/9] overflow-hidden">
                          <Image
                            src={entry.coverUrl}
                            alt=""
                            fill
                            sizes="(min-width: 768px) 40vw, 100vw"
                            className="object-cover transition duration-700 group-hover:scale-105"
                          />
                          <div
                            className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"
                            aria-hidden
                          />
                        </div>
                      )}
                      <div className="relative p-5 sm:p-6">
                        <p className="eyebrow flex items-center gap-2">
                          <span className={`size-1.5 rounded-full ${kind.dot}`} aria-hidden />
                          {kind.label}
                          <span className="md:hidden">· {formatDate(entry.date)}</span>
                        </p>
                        <h3 className="mt-2 font-display text-2xl leading-tight">{entry.title}</h3>
                        {entry.summary && <p className="mt-2 text-sm leading-6 text-muted">{entry.summary}</p>}
                        {link && (
                          <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-500">
                            {link.label} <ArrowRight className="size-4 transition group-hover:translate-x-1" />
                          </span>
                        )}
                      </div>
                    </>
                  );
                  const cardClass =
                    "spotlight group glass relative block overflow-hidden rounded-2xl transition-colors duration-300 hover:border-brand-500";
                  return (
                    <li
                      key={`${entry.kind}-${entry.id}`}
                      data-tl-item
                      style={{ "--side": side } as CSSProperties}
                      className="relative grid pl-12 md:grid-cols-2 md:gap-20 md:pl-0"
                    >
                      {/* Le point sur la ligne, qui s'allume au passage */}
                      <span className="tl-node absolute left-5 top-6 z-10 flex size-10 -translate-x-1/2 items-center justify-center rounded-full border border-border bg-surface text-muted md:left-1/2">
                        <Icon className="size-4" aria-hidden />
                      </span>
                      {/* La date, de l'autre côté de la ligne (ordinateur) */}
                      <p
                        className={`hidden self-start pt-8 font-mono text-xs uppercase tracking-wider text-muted md:block ${
                          side === 1 ? "text-right" : "md:order-2"
                        }`}
                      >
                        {formatDate(entry.date)}
                      </p>
                      <div className={`tl-swing ${side === 1 ? "" : "md:order-1"}`}>
                        {link ? (
                          <Link href={link.href} data-tilt="5" data-spotlight className={cardClass}>
                            {card}
                          </Link>
                        ) : (
                          <div data-tilt="5" data-spotlight className={cardClass}>
                            {card}
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}

          {/* La suite : une carte en pointillés pour le mois prochain */}
          {next && (
            <div className="relative pl-12 pt-14 md:flex md:justify-center md:pl-0 md:pt-20">
              <span
                aria-hidden
                className="absolute left-5 top-14 flex size-10 -translate-x-1/2 items-center justify-center rounded-full border border-dashed border-cyan/60 bg-bg md:left-1/2 md:top-20"
              >
                <span className="size-2 animate-ping rounded-full bg-cyan" />
              </span>
              <div className="relative rounded-2xl border border-dashed border-border bg-bg/60 px-6 py-5 backdrop-blur md:mt-14 md:max-w-md md:text-center">
                <p className="eyebrow">// prochaine étape · {next.long}</p>
                <p className="mt-2 font-display text-xl">La suite s&apos;écrit en {next.name}.</p>
                <p className="mt-1 text-sm text-muted">
                  Nouveaux événements, premiers projets et comptes rendus à venir.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </Container>
  );
}
