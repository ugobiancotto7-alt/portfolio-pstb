import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-28 border-t border-border bg-sunken">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[2fr_1fr_1fr]">
        <div className="max-w-sm">
          <div className="flex items-center gap-3">
            <Image src="/pstb-logo.jpg" alt="Paris School of Technology & Business" width={44} height={44} className="rounded-sm" />
            <span className="font-display text-2xl">Journal Data &amp; IA</span>
          </div>
          <p className="mt-4 text-sm leading-6 text-muted">
            Le carnet de bord d&apos;Ugo, Tim et Marcelo, étudiants en Bachelor Data &amp; IA à la Paris School of
            Technology &amp; Business.
          </p>
        </div>
        <div>
          <p className="eyebrow">Navigation</p>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link className="hover:underline" href="/equipe">Équipe</Link></li>
            <li><Link className="hover:underline" href="/timeline">Timeline</Link></li>
            <li><Link className="hover:underline" href="/articles">Articles</Link></li>
            <li><Link className="hover:underline" href="/projets">Projets</Link></li>
          </ul>
        </div>
        <div>
          <p className="eyebrow">L&apos;école</p>
          <p className="mt-4 text-sm leading-6 text-muted">
            Paris School of Technology &amp; Business
            <br />
            Bachelor Data &amp; IA
          </p>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-xs text-muted sm:flex-row sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} Ugo, Tim &amp; Marcelo</p>
          <p>Fait à la main avec Next.js, Express et PostgreSQL</p>
        </div>
      </div>
    </footer>
  );
}
