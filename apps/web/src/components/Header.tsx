"use client";
/**
 * En-tête + menu plein écran.
 * - Sur ordinateur : une barre de liens avec un surligneur qui glisse
 *   sous la souris (data-nav, voir lib/enhance.ts).
 * - Partout : un bouton "Menu" qui ouvre un grand menu plein écran ;
 *   survoler un lien affiche sa description à droite.
 */
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import type { CSSProperties } from "react";
import { ThemeToggle } from "./ThemeToggle";

const links = [
  {
    href: "/",
    label: "Accueil",
    n: "00",
    tag: "// vue d'ensemble",
    text: "Le résumé de notre année : chiffres clés, équipe, méthode et dernières publications.",
  },
  {
    href: "/equipe",
    label: "Équipe",
    n: "01",
    tag: "// 3 profils",
    text: "Ugo, Tim et Marcelo : rôles, compétences et liens LinkedIn / GitHub.",
  },
  {
    href: "/timeline",
    label: "Timeline",
    n: "02",
    tag: "// mois par mois",
    text: "Notre progression dans l'ordre chronologique : événements, articles, projets et étapes.",
  },
  {
    href: "/articles",
    label: "Articles",
    n: "03",
    tag: "// comptes rendus",
    text: "Ce qu'on a vu, appris et retenu : conférences, cours marquants et retours d'expérience.",
  },
  {
    href: "/projets",
    label: "Projets",
    n: "04",
    tag: "// data & IA",
    text: "Nos projets : contexte, technologies, résultats et code sur GitHub.",
  },
];

export function Header() {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-bg/75 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/pstb-logo.jpg" alt="" width={32} height={32} className="rounded-md" priority />
            <span className="leading-tight">
              <span className="block text-sm font-semibold tracking-tight">PSTB · Data &amp; IA</span>
              <span className="block font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                Journal 2026-27
              </span>
            </span>
          </Link>

          {/* Barre de liens (ordinateur) : la "pilule" glisse sous le lien survolé */}
          <nav
            data-nav
            className="relative hidden items-center rounded-full border border-border bg-surface/60 p-1 lg:flex"
          >
            <span
              data-nav-pill
              aria-hidden
              className="absolute left-0 top-1 h-[calc(100%-0.5rem)] rounded-full bg-brand-500/15 opacity-0 transition-all duration-300 ease-out"
            />
            {links.slice(1).map((l) => (
              <Link
                key={l.href}
                href={l.href}
                aria-current={isActive(l.href) ? "page" : undefined}
                className={`relative z-10 rounded-full px-4 py-1.5 text-sm transition ${
                  isActive(l.href) ? "text-fg" : "text-muted hover:text-fg"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <button
              type="button"
              data-menu-open
              aria-expanded="false"
              aria-controls="site-menu"
              className="group inline-flex items-center gap-2.5 rounded-full border border-border bg-surface/60 py-1.5 pl-4 pr-1.5 text-sm font-medium transition hover:border-brand-500"
            >
              Menu
              <span className="flex size-7 flex-col items-center justify-center gap-1 rounded-full bg-ink" aria-hidden>
                <span className="h-px w-3 bg-on-ink transition group-hover:w-3.5" />
                <span className="h-px w-3 bg-on-ink transition group-hover:w-2" />
              </span>
            </button>
          </div>
        </div>
        {/* Barre de lecture : se remplit pendant qu'on fait défiler la page */}
        <div
          data-scroll-progress
          aria-hidden
          className="absolute inset-x-0 -bottom-px h-px origin-left scale-x-0 bg-gradient-to-r from-brand-500 to-cyan"
        />
      </header>

      {/* Menu plein écran (caché par défaut, ouvert par lib/enhance.ts) */}
      <div id="site-menu" data-menu hidden className="fixed inset-0 z-50 overflow-y-auto bg-bg/95 backdrop-blur-2xl">
        <canvas data-starfield="soft" className="pointer-events-none absolute inset-0 size-full" aria-hidden />
        <div className="relative mx-auto flex min-h-full max-w-6xl flex-col px-4 py-5 sm:px-6">
          <div className="flex items-center justify-between">
            <span className="eyebrow">// navigation</span>
            <button
              type="button"
              data-menu-close
              className="rounded-full border border-border px-4 py-1.5 text-sm transition hover:border-brand-500"
            >
              Fermer <span className="ml-1 font-mono text-xs text-muted">esc</span>
            </button>
          </div>

          <div className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[1.4fr_1fr]">
            <ul className="space-y-1">
              {links.map((l, i) => (
                <li
                  key={l.href}
                  data-menu-item
                  style={{ "--i": i } as CSSProperties}
                  data-preview-title={l.label}
                  data-preview-text={l.text}
                  data-preview-tag={l.tag}
                >
                  <Link
                    href={l.href}
                    className="group flex items-baseline gap-5 border-b border-border py-4 transition hover:pl-3"
                  >
                    <span className="font-mono text-xs text-muted group-hover:text-cyan">{l.n}</span>
                    <span className="font-display text-5xl sm:text-6xl group-hover:text-gradient">{l.label}</span>
                    <ArrowUpRight className="ml-auto size-6 self-center text-muted opacity-0 transition group-hover:opacity-100" />
                  </Link>
                </li>
              ))}
            </ul>

            <aside data-menu-preview className="glass glow hidden rounded-2xl p-8 lg:block">
              <p data-p-tag className="font-mono text-xs text-cyan">
                {links[0].tag}
              </p>
              <p data-p-title className="mt-4 font-display text-4xl">
                {links[0].label}
              </p>
              <p data-p-text className="mt-4 leading-7 text-muted">
                {links[0].text}
              </p>
              <div className="mt-8 grid grid-cols-3 gap-3 border-t border-border pt-6 font-mono text-[11px] uppercase tracking-wider text-muted">
                <span>Python</span>
                <span>SQL</span>
                <span>ML</span>
                <span>Next.js</span>
                <span>Postgres</span>
                <span>Observabilité</span>
              </div>
            </aside>
          </div>

          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
            Bachelor Data &amp; IA · Paris School of Technology &amp; Business
          </p>
        </div>
      </div>
    </>
  );
}
