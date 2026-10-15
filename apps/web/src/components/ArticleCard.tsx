import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ARTICLE_TYPE_LABELS, type ArticleSummary } from "@pstb/shared";
import { formatDate, joinNames } from "@/lib/format";

/** Carte d'article. `featured` : grande carte en deux colonnes pour l'article à la une. */
export function ArticleCard({ article, featured = false }: { article: ArticleSummary; featured?: boolean }) {
  return (
    <Link
      href={`/articles/${article.slug}`}
      data-spotlight
      className={`spotlight group glass glow relative flex flex-col overflow-hidden rounded-2xl transition hover:border-brand-500 ${
        featured ? "md:grid md:grid-cols-[1.2fr_1fr] md:rounded-3xl" : ""
      }`}
    >
      <div
        className={`relative aspect-[4/3] overflow-hidden bg-sunken ${featured ? "md:aspect-auto md:min-h-[420px]" : ""}`}
      >
        {article.coverUrl && (
          <Image
            src={article.coverUrl}
            alt=""
            fill
            sizes={
              featured ? "(min-width: 768px) 55vw, 100vw" : "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            }
            className="object-cover transition duration-700 group-hover:scale-105"
          />
        )}
      </div>
      <div className={`flex flex-1 flex-col p-6 ${featured ? "md:justify-center md:p-12" : ""}`}>
        {featured && <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.16em] text-cyan">● À la une</p>}
        <p className="eyebrow">
          {ARTICLE_TYPE_LABELS[article.type]} · {formatDate(article.publishedAt)}
        </p>
        <h3 className={`mt-2 font-display leading-tight ${featured ? "text-3xl sm:text-4xl" : "text-2xl"}`}>
          {article.title}
        </h3>
        <p className={`mt-3 text-sm leading-6 text-muted ${featured ? "sm:text-base sm:leading-7" : "line-clamp-3"}`}>
          {article.excerpt}
        </p>
        <p className={`pt-4 text-xs text-muted ${featured ? "mt-6" : "mt-auto"}`}>
          Par {joinNames(article.authors.map((a) => a.firstName))}
        </p>
        {featured && (
          <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-500">
            Lire l&apos;article <ArrowRight className="size-4 transition group-hover:translate-x-1" />
          </span>
        )}
      </div>
    </Link>
  );
}
