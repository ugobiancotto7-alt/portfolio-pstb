/**
 * Page d'accueil. C'est un Server Component (par défaut dans Next.js) :
 * il peut être "async" et appeler l'API directement avant d'envoyer le HTML.
 */
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ArticleCard } from "@/components/ArticleCard";
import { Avatar } from "@/components/Avatar";
import { api } from "@/lib/api";

export default async function HomePage() {
  // Les deux appels partent en parallèle.
  const [members, articles] = await Promise.all([api.members(), api.articles()]);

  return (
    <>
      <section className="py-8 sm:py-16">
        <p className="text-sm font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">
          Bachelor Data &amp; IA · PSTB · 2026-2027
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-extrabold tracking-tight sm:text-6xl">
          Notre année en data et en IA,{" "}
          <span className="bg-gradient-to-r from-brand-500 to-accent-500 bg-clip-text text-transparent">
            racontée au fil des mois.
          </span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted">
          Projets, compétences, événements et apprentissages : le journal de bord de trois étudiants de la Paris
          School of Technology &amp; Business.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/timeline"
            className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Voir la timeline <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/equipe"
            className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold transition hover:border-brand-500"
          >
            Rencontrer l&apos;équipe
          </Link>
        </div>
        <div className="mt-10 flex -space-x-2">
          {members.map((m) => (
            <span key={m.id} className="rounded-full ring-4 ring-bg" title={m.firstName}>
              <Avatar member={m} size={44} />
            </span>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Derniers articles</h2>
          <Link href="/articles" className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">
            Tous les articles →
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {articles.items.slice(0, 3).map((a) => (
            <ArticleCard key={a.id} article={a} />
          ))}
        </div>
      </section>
    </>
  );
}
