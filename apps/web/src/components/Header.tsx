"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "./ThemeToggle";

// Les numéros 01, 02… sont un motif repris dans tout le site.
const links = [
  { href: "/equipe", label: "Équipe", n: "01" },
  { href: "/timeline", label: "Timeline", n: "02" },
  { href: "/articles", label: "Articles", n: "03" },
  { href: "/projets", label: "Projets", n: "04" },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false); // menu mobile ouvert ?

  const linkClass = (href: string) =>
    `group inline-flex items-baseline gap-1.5 py-2 text-sm font-medium transition ${
      pathname.startsWith(href) ? "text-fg" : "text-muted hover:text-fg"
    }`;

  return (
    <>
      {/* Bandeau d'information fin, au-dessus de l'en-tête */}
      <div className="border-b border-border bg-sunken text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
        <div className="mx-auto flex h-8 max-w-6xl items-center justify-between px-4 sm:px-6">
          <span>Bachelor Data &amp; IA · PSTB</span>
          <span className="hidden sm:inline">Promotion 2026-2027 · Paris</span>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-border bg-bg/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
            <Image src="/pstb-logo.jpg" alt="" width={34} height={34} className="rounded-sm" priority />
            <span className="font-display text-2xl leading-none">Journal Data &amp; IA</span>
          </Link>

          {/* Navigation "bureau" : cachée sur mobile (mobile first : hidden, puis lg:flex) */}
          <nav className="hidden items-center gap-7 lg:flex">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className={linkClass(l.href)}>
                <sup className="text-[10px] text-muted">{l.n}</sup>
                <span className="border-b border-transparent group-hover:border-current">{l.label}</span>
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/articles"
              className="hidden rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-on-ink transition hover:opacity-85 sm:inline-flex"
            >
              Lire nos articles
            </Link>
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setOpen(!open)}
              className="rounded-full p-2 text-muted hover:text-fg lg:hidden"
              aria-label="Ouvrir le menu"
              aria-expanded={open}
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {open && (
          <nav className="border-t border-border px-4 pb-4 lg:hidden">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="flex items-baseline gap-3 border-b border-border py-4 font-display text-2xl"
                onClick={() => setOpen(false)}
              >
                <span className="font-sans text-xs text-muted">{l.n}</span>
                {l.label}
              </Link>
            ))}
          </nav>
        )}
      </header>
    </>
  );
}
