/**
 * Page d'un article. Le dossier [slug] est un "segment dynamique" : Next
 * passe la valeur de l'URL dans `params` (une Promise depuis Next 15).
 */
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ARTICLE_TYPE_LABELS } from "@pstb/shared";
import { Avatar } from "@/components/Avatar";
import { Container } from "@/components/Container";
import { Gallery } from "@/components/Gallery";
import { Halo } from "@/components/Halo";
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

  // Fiche "pratique" de l'événement, affichée à côté du texte
  const facts = [
    article.event && { label: "Événement", value: article.event.title },
    article.event && { label: "Date", value: formatDate(article.event.startsOn) },
    article.event?.location && { label: "Lieu", value: article.event.location },
    { label: "Par", value: joinNames(article.authors.map((a) => a.firstName)) },
  ].filter((f): f is { label: string; value: string } => Boolean(f));

  return (
    <article>
      <Container>
        <div className="pt-12 sm:pt-16">
          <Link href="/articles" className="text-sm text-muted hover:text-fg">
            ← Tous les articles
          </Link>
          <p className="eyebrow mt-8">
            {ARTICLE_TYPE_LABELS[article.type]} · {formatDate(article.publishedAt)}
          </p>
          <h1 className="mt-4 max-w-5xl font-display text-4xl leading-[1.02] sm:text-6xl">{article.title}</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">{article.excerpt}</p>
        </div>

        {article.coverUrl && (
          <div className="halo mt-12">
            <Halo src={article.coverUrl} />
            <div className="glow relative aspect-[16/9] overflow-hidden rounded-3xl bg-sunken">
              <Image
                src={article.coverUrl}
                alt=""
                fill
                priority
                sizes="(min-width: 1152px) 1152px, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        )}

        <div className="mt-14 grid gap-12 lg:grid-cols-[260px_1fr]">
          {/* Colonne de gauche : infos pratiques (passe au-dessus du texte sur mobile) */}
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <dl className="glass divide-y divide-border rounded-2xl px-5">
              {facts.map((f) => (
                <div key={f.label} className="py-4">
                  <dt className="eyebrow">{f.label}</dt>
                  <dd className="mt-1 font-medium">{f.value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-5 flex -space-x-2">
              {article.authors.map((m) => (
                <span key={m.id} className="rounded-full ring-2 ring-bg">
                  <Avatar member={m} size={40} />
                </span>
              ))}
            </div>
          </aside>

          <div className="max-w-2xl">
            <Markdown content={article.content} />
          </div>
        </div>

        {/* La couverture est déjà affichée en haut : on ne la répète pas dans la galerie */}
        <Gallery photos={article.photos.filter((p) => p.url !== article.coverUrl)} />
      </Container>
    </article>
  );
}
