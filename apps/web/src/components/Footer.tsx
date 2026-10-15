import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="relative mt-32 overflow-hidden border-t border-border">
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[2fr_1fr_1fr]">
        <div className="max-w-sm">
          <div className="flex items-center gap-3">
            <Image
              src="/pstb-logo.jpg"
              alt="Paris School of Technology & Business"
              width={40}
              height={40}
              className="rounded-md"
            />
            <span className="text-lg font-semibold tracking-tight">PSTB · Data &amp; IA</span>
          </div>
          <p className="mt-4 text-sm leading-6 text-muted">
            Le journal de bord d&apos;Ugo, Tim et Marcelo, étudiants en Bachelor Data &amp; IA à la Paris School of
            Technology &amp; Business.
          </p>
        </div>
        <div>
          <p className="eyebrow">Navigation</p>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link className="text-muted transition hover:text-fg" href="/equipe">
                Équipe
              </Link>
            </li>
            <li>
              <Link className="text-muted transition hover:text-fg" href="/timeline">
                Timeline
              </Link>
            </li>
            <li>
              <Link className="text-muted transition hover:text-fg" href="/articles">
                Articles
              </Link>
            </li>
            <li>
              <Link className="text-muted transition hover:text-fg" href="/projets">
                Projets
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="eyebrow">Stack du site</p>
          <ul className="mt-4 space-y-2 font-mono text-xs text-muted">
            <li>Next.js · React · Tailwind</li>
            <li>Express · PostgreSQL</li>
            <li>Supabase · Vercel</li>
          </ul>
        </div>
      </div>
      <div className="relative border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 font-mono text-[11px] uppercase tracking-wider text-muted sm:flex-row sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} Ugo, Tim &amp; Marcelo</p>
          <p className="inline-flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-cyan" aria-hidden /> Tous les systèmes opérationnels
          </p>
        </div>
      </div>
    </footer>
  );
}
