/**
 * Page d'accueil, style "IA / business" :
 *   1. hero dans l'espace : texte à gauche, planète neuronale 3D à droite, ciel étoilé
 *   2. tableau de bord : 4 cartes cliquables avec chiffres animés
 *   3. notre méthode présentée comme un pipeline de données (cartes qui zooment)
 *   4. l'équipe (cartes qui s'inclinent en 3D sous la souris)
 *   5. le dernier compte rendu
 *   6. toutes les photos, dans une bande 3D qu'on fait glisser
 *   7. bandeau final avec la jauge de l'année
 *
 * C'est un Server Component : il est "async" et appelle l'API avant
 * d'envoyer le HTML. Les animations sont ajoutées ensuite par lib/enhance.ts.
 */
import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BrainCircuit,
  CalendarDays,
  Camera,
  Database,
  FileText,
  Rocket,
  Sparkles,
  Users,
} from "lucide-react";
import type { CSSProperties } from "react";
import { Avatar } from "@/components/Avatar";
import { Container } from "@/components/Container";
import { SectionHeading } from "@/components/SectionHeading";
import { Starfield } from "@/components/Starfield";
import { YearGauge } from "@/components/YearGauge";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { ofMonth, schoolYear } from "@/lib/year";

const pad = (n: number) => String(n).padStart(2, "0");
/** Décalage d'animation en cascade, lu par le CSS de data-reveal */
const delay = (i: number) => ({ "--i": i }) as CSSProperties;

// Les 5 étapes d'un projet data, de la donnée brute au modèle surveillé
const pipeline = [
  { icon: Database, step: "Collecter", text: "Trouver et récupérer les bonnes données : API, fichiers, bases SQL." },
  { icon: Sparkles, step: "Nettoyer", text: "Corriger, compléter et explorer les données avec pandas et SQL." },
  { icon: BrainCircuit, step: "Modéliser", text: "Entraîner et évaluer des modèles de machine learning." },
  { icon: Rocket, step: "Déployer", text: "Mettre le modèle à disposition via une API ou une application." },
  { icon: Activity, step: "Observer", text: "Surveiller qualité, latence et coûts une fois en production." },
];

export default async function HomePage() {
  const [members, articles, stats, events] = await Promise.all([
    api.members(),
    api.articles(),
    api.stats(),
    api.events(),
  ]);
  const year = schoolYear();
  const eventMonths = new Set(events.map((e) => e.startsOn.slice(0, 7)));
  const latest = articles.items[0];
  const latestFull = latest ? await api.article(latest.slug) : null;
  const photos = latestFull?.photos.filter((p) => p.url) ?? [];
  // Toutes les photos de l'événement, sauf la couverture (déjà affichée avec le dernier article)
  const moments = photos.filter((p) => p.url !== latest?.coverUrl);

  const event = latestFull?.event ?? null;
  const articleHref = latest ? `/articles/${latest.slug}` : "/articles";

  // Les 4 cartes du tableau de bord. "visual" est le petit aperçu affiché sous le chiffre.
  const metrics = [
    {
      icon: Users,
      label: "Étudiants",
      value: members.length,
      href: "/equipe",
      detail: members.map((m) => m.firstName).join(", "),
      visual: (
        <div className="flex -space-x-2">
          {members.map((m) => (
            <span
              key={m.id}
              className="rounded-full ring-2 ring-surface transition duration-300 group-hover:-translate-y-1"
            >
              <Avatar member={m} size={36} />
            </span>
          ))}
        </div>
      ),
    },
    {
      icon: CalendarDays,
      label: "Événements",
      value: stats.totals.events,
      href: "/timeline",
      detail: event ? `${event.title} · ${formatDate(event.startsOn)}` : "Bientôt",
      visual: (
        <div className="flex items-end gap-1" aria-hidden>
          {/* Une mini-frise de l'année : un trait par mois, ceux qui ont eu un événement s'allument */}
          {year.months.map((m, k) => (
            <span
              key={m.key}
              className={`flex-1 rounded-sm transition-all duration-500 ${
                eventMonths.has(m.key)
                  ? "h-7 bg-cyan shadow-[0_0_10px_var(--accent-2)]"
                  : m.future
                    ? "h-3 bg-border/60 group-hover:h-4"
                    : "h-4 bg-brand-500/40 group-hover:h-5"
              }`}
              style={{ transitionDelay: `${k * 25}ms` }}
            />
          ))}
        </div>
      ),
    },
    {
      icon: FileText,
      label: "Articles",
      value: stats.totals.articles,
      href: articleHref,
      detail: latest ? `Dernier : ${latest.title}` : "Bientôt",
      visual: (
        <div className="space-y-1.5" aria-hidden>
          <span className="block h-1.5 w-full rounded-full bg-border" />
          <span className="block h-1.5 w-4/5 rounded-full bg-border" />
          <span className="block h-1.5 w-3/5 rounded-full bg-brand-500/60 transition-all duration-500 group-hover:w-full" />
        </div>
      ),
    },
    {
      icon: Camera,
      label: "Photos",
      value: photos.length,
      href: `${articleHref}#galerie`,
      detail: event ? `Galerie ${event.title}` : "Galerie",
      visual: (
        <div className="flex gap-1.5">
          {photos.slice(0, 3).map((p, k) => (
            <span
              key={p.id}
              className="relative aspect-square flex-1 overflow-hidden rounded-md border border-border transition duration-300 group-hover:-translate-y-1"
              style={{ transitionDelay: `${k * 60}ms` }}
            >
              <Image src={p.url!} alt="" fill sizes="60px" className="object-cover" />
            </span>
          ))}
        </div>
      ),
    },
  ];

  return (
    <>
      {/* 1. HERO */}
      {/* La classe "dark" force les couleurs sombres ici, même en thème clair : c'est l'espace. */}
      <section className="dark relative overflow-hidden border-b border-border bg-bg text-fg">
        {/* Halos de couleur flous en fond */}
        <div
          className="pointer-events-none absolute -left-40 top-10 size-[520px] rounded-full bg-brand-500/20 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-20 bottom-0 size-[420px] rounded-full bg-cyan/10 blur-3xl"
          aria-hidden
        />
        {/* Le ciel étoilé, par-dessus les halos de couleur (qui font office de nébuleuses) */}
        <Starfield />

        <Container className="relative grid items-center gap-6 py-14 lg:grid-cols-[1.15fr_1fr] lg:py-20">
          <div>
            <p className="glass inline-flex items-center gap-2 rounded-full px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-muted">
              <span className="size-1.5 animate-pulse rounded-full bg-cyan" aria-hidden />
              Bachelor Data &amp; IA · PSTB · {year.label}
            </p>
            <h1 className="mt-6 font-display text-5xl leading-[1.02] sm:text-6xl lg:text-[3.6rem] xl:text-[4rem]">
              Apprendre la data.
              <br />
              <span className="text-gradient">Construire l&apos;IA.</span>
              <br />
              Le documenter.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-muted">
              Le journal de bord d&apos;Ugo, Tim et Marcelo : nos projets, nos compétences et les événements qui
              façonnent notre année.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/timeline"
                className="group inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-on-ink transition hover:opacity-90"
              >
                Explorer la timeline <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/projets"
                className="glass inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition hover:border-brand-500"
              >
                Voir nos projets
              </Link>
            </div>
          </div>

          {/*
            La planète 3D : un <canvas> animé par lib/effects/planet.ts.
            Il déborde de 15 % de chaque côté pour laisser de la place à l'anneau.
            touch-pan-y : sur mobile, glisser verticalement fait toujours défiler la page.
          */}
          <div className="relative mx-auto aspect-square w-full max-w-[520px]">
            <canvas
              data-neural
              className="absolute -left-[15%] -top-[15%] h-[130%] w-[130%] cursor-grab touch-pan-y"
              aria-label="Planète formée d'un réseau de neurones en 3D, avec un point sur Paris : nous sommes ici"
            />
            <span className="glass absolute left-2 top-8 hidden rounded-lg px-3 py-2 font-mono text-[11px] text-muted sm:block">
              <span className="text-cyan">●</span> model.status = <span className="text-fg">&quot;learning&quot;</span>
            </span>
            <span className="glass absolute bottom-10 right-2 rounded-lg px-3 py-2 font-mono text-[11px] text-muted">
              epoch <span className="text-fg">{pad(year.currentIndex + 1)}/12</span> · mois{" "}
              {ofMonth(year.months[year.currentIndex].name)}
            </span>
          </div>
        </Container>

        {/* 2. Tableau de bord : 4 cartes cliquables, chiffres animés, halo qui suit la souris */}
        <Container className="relative pb-12">
          <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {metrics.map(({ icon: Icon, label, value, href, detail, visual }, i) => (
              <li key={label} data-reveal style={delay(i)}>
                <Link
                  href={href}
                  data-spotlight
                  data-tilt="8"
                  className="spotlight group glass relative flex h-full flex-col overflow-hidden rounded-2xl p-4 transition duration-300 hover:-translate-y-1 hover:border-brand-500 sm:p-5"
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex size-9 items-center justify-center rounded-xl border border-border bg-sunken text-brand-500 transition group-hover:border-brand-500 group-hover:text-cyan">
                      <Icon className="size-4" />
                    </span>
                    <span className="font-mono text-[10px] text-muted">0{i + 1}</span>
                  </div>
                  <p className="mt-4 font-display text-5xl tabular-nums leading-none sm:text-6xl">
                    <span data-count={value}>{pad(value)}</span>
                  </p>
                  <p className="eyebrow mt-2">{label}</p>
                  <div className="mt-4 flex-1">{visual}</div>
                  <p className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-3 text-xs text-muted">
                    <span className="line-clamp-1">{detail}</span>
                    <ArrowUpRight className="size-3.5 shrink-0 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-cyan" />
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* 3. MÉTHODE = PIPELINE (les cartes zooment au survol) */}
      <Container className="mt-28">
        <SectionHeading n="01" label="Méthode" title="Notre façon de travailler, comme un pipeline.">
          Chaque projet suit les étapes d&apos;un vrai workflow data, de la donnée brute au modèle surveillé en
          production.
        </SectionHeading>

        <div className="relative">
          {/* La ligne qui relie les étapes, avec un point lumineux qui circule */}
          <div className="absolute left-0 right-0 top-[38px] hidden h-px bg-border lg:block" aria-hidden>
            <span className="flow-dot absolute -top-[3px] size-[7px] rounded-full bg-cyan shadow-[0_0_12px_var(--accent-2)]" />
          </div>
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {pipeline.map(({ icon: Icon, step, text }, i) => (
              <li
                key={step}
                data-reveal
                style={delay(i)}
                className="group glass relative rounded-2xl p-5 transition duration-300 hover:z-10 hover:scale-[1.06] hover:border-brand-500 hover:shadow-[0_24px_60px_-24px_var(--glow)]"
              >
                <div className="flex items-center justify-between">
                  <span className="flex size-10 items-center justify-center rounded-xl border border-border bg-bg text-brand-500 transition group-hover:bg-brand-500 group-hover:text-on-ink">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <span className="font-mono text-xs text-muted">{pad(i + 1)}</span>
                </div>
                <h3 className="mt-5 text-lg font-semibold">{step}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </Container>

      {/* 4. ÉQUIPE (cartes inclinables) */}
      <Container className="mt-28">
        <SectionHeading n="02" label="Équipe" title="Trois profils, une même promo.">
          Passez la souris sur une carte pour la voir bouger en 3D.
        </SectionHeading>
        <div className="grid gap-6 sm:grid-cols-3">
          {members.map((m, i) => (
            <div key={m.id} data-reveal style={delay(i)}>
              <Link
                href={`/equipe#${m.slug}`}
                data-tilt="10"
                className="group glass glow block overflow-hidden rounded-2xl"
              >
                <div className="relative aspect-[4/5] overflow-hidden">
                  {m.avatarUrl && (
                    <Image
                      src={m.avatarUrl}
                      alt={m.firstName}
                      fill
                      sizes="(min-width: 640px) 33vw, 100vw"
                      className="object-cover transition duration-500 group-hover:scale-105"
                    />
                  )}
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"
                    aria-hidden
                  />
                  <span className="absolute left-4 top-4 rounded-full bg-black/40 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-white backdrop-blur">
                    {pad(i + 1)} / {pad(members.length)}
                  </span>
                  <div className="absolute inset-x-4 bottom-4 flex items-end justify-between text-white">
                    <div>
                      <p className="text-2xl font-semibold tracking-tight">{m.firstName}</p>
                      <p className="text-xs text-white/70">{m.role}</p>
                    </div>
                    <ArrowUpRight className="size-5 opacity-0 transition group-hover:opacity-100" />
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </Container>

      {/* 5. DERNIER COMPTE RENDU */}
      {latest && (
        <Container className="mt-28">
          <SectionHeading n="03" label="Dernier article" title="Sur le terrain." />
          <Link
            href={`/articles/${latest.slug}`}
            data-reveal
            className="group glass glow grid overflow-hidden rounded-3xl md:grid-cols-2"
          >
            <div className="relative aspect-[4/3] overflow-hidden md:aspect-auto md:min-h-[380px]">
              {latest.coverUrl && (
                <Image
                  src={latest.coverUrl}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover transition duration-700 group-hover:scale-105"
                />
              )}
            </div>
            <div className="flex flex-col justify-center p-8 sm:p-12">
              <p className="eyebrow">Compte rendu · {formatDate(latest.publishedAt)}</p>
              <h3 className="mt-4 font-display text-4xl leading-tight">{latest.title}</h3>
              <p className="mt-4 leading-7 text-muted">{latest.excerpt}</p>
              <span className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-brand-500">
                Lire le compte rendu <ArrowRight className="size-4 transition group-hover:translate-x-1" />
              </span>
            </div>
          </Link>
        </Container>
      )}

      {/* 6. EN IMAGES : toutes les photos, dans une bande 3D qu'on fait glisser */}
      {moments.length > 0 && (
        <section className="mt-28">
          <Container>
            <SectionHeading n="04" label="En images" title="La journée en photos.">
              Faites glisser la bande, cliquez sur une photo pour l&apos;ouvrir en grand.
            </SectionHeading>
          </Container>
          <div data-carousel data-reveal className="relative">
            <ul
              data-carousel-track
              data-lightbox
              className="no-scrollbar flex cursor-grab snap-x snap-mandatory gap-4 overflow-x-auto px-[max(1rem,calc(50vw-36rem+1.5rem))] py-6 [scroll-padding-inline:max(1rem,calc(50vw-36rem+1.5rem))]"
            >
              {moments.map((p, i) => (
                <li key={p.id} className="w-[72vw] shrink-0 snap-center sm:w-[300px]">
                  <div
                    data-full={p.url!}
                    data-caption={p.caption ?? p.alt}
                    className="group relative aspect-[3/4] overflow-hidden rounded-2xl border border-border shadow-[0_30px_60px_-30px_var(--glow)]"
                  >
                    <Image
                      src={p.url!}
                      alt={p.alt}
                      fill
                      draggable={false}
                      sizes="(min-width: 640px) 300px, 72vw"
                      className="object-cover transition duration-700 group-hover:scale-105"
                    />
                    <div
                      className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent"
                      aria-hidden
                    />
                    <p className="absolute inset-x-4 bottom-4 text-sm text-white">
                      <span className="mr-2 font-mono text-xs text-white/60">
                        {pad(i + 1)}/{pad(moments.length)}
                      </span>
                      {p.caption}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <Container className="flex items-center justify-between">
              <p className="font-mono text-[11px] uppercase tracking-wider text-muted">
                {pad(moments.length)} photos · {latest?.title}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  data-carousel-prev
                  aria-label="Photos précédentes"
                  className="glass flex size-11 items-center justify-center rounded-full transition hover:border-brand-500"
                >
                  <ArrowLeft className="size-4" />
                </button>
                <button
                  type="button"
                  data-carousel-next
                  aria-label="Photos suivantes"
                  className="glass flex size-11 items-center justify-center rounded-full transition hover:border-brand-500"
                >
                  <ArrowRight className="size-4" />
                </button>
              </div>
            </Container>
          </div>
        </section>
      )}

      {/* 7. BANDEAU FINAL : le ciel étoilé + la jauge de l'année */}
      <Container className="mt-28">
        <div
          data-reveal
          className="dark relative overflow-hidden rounded-3xl border border-border bg-bg px-6 py-14 text-fg sm:px-14 sm:py-16"
        >
          <div
            className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-brand-500/25 blur-3xl"
            aria-hidden
          />
          <Starfield />
          <div className="relative grid items-center gap-10 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <p className="eyebrow">// la suite</p>
              <h2 className="mt-4 max-w-2xl font-display text-4xl leading-[1.05] sm:text-6xl">
                Suivez notre progression, <span className="text-gradient">mois après mois.</span>
              </h2>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link
                  href="/timeline"
                  className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-on-ink transition hover:opacity-90"
                >
                  Ouvrir la timeline
                </Link>
                <Link
                  href="/articles"
                  className="glass rounded-full px-6 py-3 text-sm font-semibold transition hover:border-brand-500"
                >
                  Lire les articles
                </Link>
              </div>
            </div>
            <YearGauge />
          </div>
        </div>
      </Container>
    </>
  );
}
