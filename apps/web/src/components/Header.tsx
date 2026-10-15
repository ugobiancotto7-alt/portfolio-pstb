"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "./ThemeToggle";

const links = [
  { href: "/equipe", label: "Équipe" },
  { href: "/timeline", label: "Timeline" },
  { href: "/articles", label: "Articles" },
  { href: "/projets", label: "Projets" },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false); // menu mobile ouvert ?

  const linkClass = (href: string) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition ${
      pathname.startsWith(href) ? "bg-brand-500/10 text-brand-600 dark:text-brand-400" : "text-muted hover:text-fg"
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="font-bold tracking-tight" onClick={() => setOpen(false)}>
          <span className="bg-gradient-to-r from-brand-500 to-accent-500 bg-clip-text text-transparent">PSTB</span>{" "}
          Data &amp; IA
        </Link>

        {/* Navigation "bureau" : cachée sur mobile (mobile first : hidden, puis md:flex) */}
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className={linkClass(l.href)}>
              {l.label}
            </Link>
          ))}
          <ThemeToggle />
        </nav>

        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="rounded-full p-2 text-muted hover:text-fg"
            aria-label="Ouvrir le menu"
            aria-expanded={open}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="flex flex-col gap-1 border-t border-border px-4 py-3 md:hidden">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className={linkClass(l.href)} onClick={() => setOpen(false)}>
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
