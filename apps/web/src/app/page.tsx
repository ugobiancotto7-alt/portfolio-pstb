/**
 * Page d'accueil, style "IA / business" :
 *   1. hero : texte à gauche, sphère neuronale 3D interactive à droite
 *   2. tableau de bord : 4 cartes cliquables avec chiffres animés
 *   3. notre méthode présentée comme un pipeline de données (cartes qui zooment)
 *   4. l'équipe (cartes qui s'inclinent en 3D sous la souris)
 *   5. le dernier compte rendu
 *   6. quelques moments en images
 *   7. bandeau final
 *
 * C'est un Server Component : il est "async" et appelle l'API avant
 * d'envoyer le HTML. Les animations sont ajoutées ensuite par lib/enhance.ts.
 */
import Image from "next/image";
import Link from "next/link";
import {
  Activity,
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
import { Avatar } from "@/components/Avatar";
import { Container } from "@/components/Container";
import { SectionHeading } from "@/components/SectionHeading";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";

const pad = (n: number) => String(n).padStart(2, "0");

// Les 5 étapes d'un projet data, de la donnée brute au modèle surveillé
const pipeline = [
  { icon: Database, step: "Collecter", text: "Trouver et récupérer les bonnes données : API, fichiers, bases SQL." },
  { icon: Sparkles, step: "Nettoyer", text: "Corriger, compléter et explorer les données avec pandas et SQL." },
  { icon: BrainCircuit, step: "Modéliser", text: "Entraîner et évaluer des modèles de machine learning." },
  { icon: Rocket, step: "Déployer", text: "Mettre le modèle à disposition via une API ou une application." },
  { icon: Activity, step: "Observer", text: "Surveiller qualité, latence et coûts une fois en production." },
];

export default async function HomePage() {
  const [members, articles, stats] = await Promise.all([api.members(), api.articles(), api.stats()]);
  const latest = articles.items[0];
  const latestFull = latest ? await api.article(latest.slug) : null;
  const photos = latestFull?.photos.filter((p) => p.url) ?? [];
  const moments = photos.slice(2, 5); // 3 photos différentes de la couverture

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
        <div className="flex items-center gap-1" aria-hidden>
          {/* Une mini-frise de l'année : un trait par mois, le mois de l'événement allumé */}
          {Array.from({ length: 10 }, (_, k) => (
            <span
              key={k}
              className={`h-6 flex-1 rounded-sm ${k === 1 ? "bg-cyan shadow-[0_0_10px_var(--accent-2)]" : "bg-border"}`}
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
      <section className="relative overflow-hidden border-b border-border">
        <div className="bg-grid pointer-events-none absolute inset-0" aria-hidden />
        {/* Halos de couleur flous en fond */}
        <div
          className="pointer-events-none absolute -left-40 top-10 size-[520px] rounded-full bg-brand-500/20 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-20 bottom-0 size-[420px] rounded-full bg-cyan/10 blur-3xl"
          aria-hidden
        />

        <Container className="relative grid items-center gap-6 py-14 lg:grid-cols-[1.1fr_1fr] lg:py-20">
          <div>
            <p className="glass inline-flex items-center gap-2 rounded-full px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-muted">
              <span className="size-1.5 animate-pulse rounded-full bg-cyan" aria-hidden />
              Bachelor Data &amp; IA · PSTB · 2026-2027
            </p>
            <h1 className="mt-6 font-display text-5xl leading-[1.02] sm:text-6xl lg:text-7xl">
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

          {/* La sphère 3D : un <canvas> animé par lib/enhance.ts */}
          <div className="relative mx-auto aspect-square w-full max-w-[520px]">
            <canvas
              data-neural
              className="h-full w-full cursor-grab touch-none"
              aria-label="Réseau de neurones en 3D, animé"
            />
            <span className="glass absolute left-2 top-8 rounded-lg px-3 py-2 font-mono text-[11px] text-muted">
              <span className="text-cyan">●</span> model.status = <span className="text-fg">&quot;learning&quot;</span>
            </span>
            <span className="glass absolute bottom-10 right-2 rounded-lg px-3 py-2 font-mono text-[11px] text-muted">
              epoch <span className="text-fg">02/12</span> · mois d&apos;octobre
            </span>
          </div>
        </Container>

        {/* 2. Tableau de bord : 4 cartes cliquables, chiffres animés, halo qui suit la souris */}
        <Container className="relative pb-12">
          <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {metrics.map(({ icon: Icon, label, value, href, detail, visual }, i) => (
              <li key={label}>
                <Link
                  href={href}
                  data-spotlight
                  data-tilt="8"
                  className="metric-card group glass relative flex h-full flex-col overflow-hidden rounded-2xl p-4 transition duration-300 hover:-translate-y-1 hover:border-brand-500 sm:p-5"
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
            <Link
              key={m.id}
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
          ))}
        </div>
      </Container>

      {/* 5. DERNIER COMPTE RENDU */}
      {latest && (
        <Container className="mt-28">
          <SectionHeading n="03" label="Dernier article" title="Sur le terrain." />
          <Link
            href={`/articles/${latest.slug}`}
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

      {/* 6. MOMENTS */}
      {moments.length > 0 && latest && (
        <Container className="mt-28">
          <SectionHeading n="04" label="En images" title="Quelques moments.">
            Les photos de nos événements, ajoutées par l&apos;équipe.
          </SectionHeading>
          <ul className="grid gap-4 sm:grid-cols-3">
            {moments.map((p, i) => (
              <li key={p.id}>
                <Link
                  href={`/articles/${latest.slug}#galerie`}
                  className="group block overflow-hidden rounded-2xl border border-border"
                >
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <Image
                      src={p.url!}
                      alt={p.alt}
                      fill
                      sizes="(min-width: 640px) 33vw, 100vw"
                      className="object-cover transition duration-700 group-hover:scale-110"
                    />
                    <div
                      className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent"
                      aria-hidden
                    />
                    <p className="absolute inset-x-4 bottom-4 text-sm text-white">
                      <span className="mr-2 font-mono text-xs text-white/60">{pad(i + 1)}</span>
                      {p.caption}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      )}

      {/* 7. BANDEAU FINAL */}
      <Container className="mt-28">
        <div className="relative overflow-hidden rounded-3xl border border-border px-6 py-16 sm:px-14 sm:py-20">
          <div className="bg-grid pointer-events-none absolute inset-0" aria-hidden />
          <div
            className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-brand-500/25 blur-3xl"
            aria-hidden
          />
          <div className="relative">
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
        </div>
      </Container>
    </>
  );
}
