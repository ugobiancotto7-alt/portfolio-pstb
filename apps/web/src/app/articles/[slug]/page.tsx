/**
 * Page d'un article. Le dossier [slug] est un "segment dynamique" : Next
 * passe la valeur de l'URL dans `params` (une Promise depuis Next 15).
 */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, MapPin } from "lucide-react";
import { ARTICLE_TYPE_LABELS } from "@pstb/shared";
import { Avatar } from "@/components/Avatar";
import { Gallery } from "@/components/Gallery";
import { Markdown } from "@/components/Markdown";
import { api } from "@/lib/api";
import { formatDate, joinNames } from "@/lib/format";

type Props = { params: Promise<{ slug: string }> };

// Titre et description de l'onglet / des partages sur les réseaux sociaux
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = await api.article((await params).slug);
  return article ? { title: article.title, description: article.excerpt } : {};
}

export default async function ArticlePage({ params }: Props) {
  const article = await api.article((await params).slug);
  if (!article) notFound(); // affiche app/not-found.tsx avec un code 404

  return (
    <article className="mx-auto max-w-3xl">
      <Link href="/articles" className="text-sm text-muted hover:text-fg">
        ← Tous les articles
      </Link>
      <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">
        {ARTICLE_TYPE_LABELS[article.type]}
      </p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-5xl">{article.title}</h1>
      <p className="mt-4 text-lg text-muted">{article.excerpt}</p>

      {article.event && (
        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="size-4" aria-hidden /> {formatDate(article.event.startsOn)}
          </span>
          {article.event.location && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-4" aria-hidden /> {article.event.location}
            </span>
          )}
        </div>
      )}

      <div className="mt-6 flex items-center gap-3 border-y border-border py-4">
        <div className="flex -space-x-2">
          {article.authors.map((m) => (
            <span key={m.id} className="rounded-full ring-2 ring-bg">
              <Avatar member={m} size={32} />
            </span>
          ))}
        </div>
        <p className="text-sm text-muted">
          Par {joinNames(article.authors.map((a) => a.firstName))} · {formatDate(article.publishedAt)}
        </p>
      </div>

      <div className="mt-8">
        <Markdown content={article.content} />
      </div>

      <Gallery photos={article.photos} />
    </article>
  );
}
