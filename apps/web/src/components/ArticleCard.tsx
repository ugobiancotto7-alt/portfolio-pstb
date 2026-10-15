import Image from "next/image";
import Link from "next/link";
import { ARTICLE_TYPE_LABELS, type ArticleSummary } from "@pstb/shared";
import { formatDate, joinNames } from "@/lib/format";

export function ArticleCard({ article }: { article: ArticleSummary }) {
  return (
    <Link
      href={`/articles/${article.slug}`}
      className="group glass flex flex-col overflow-hidden rounded-2xl transition hover:border-brand-500"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-sunken">
        {article.coverUrl && (
          <Image
            src={article.coverUrl}
            alt=""
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition duration-700 group-hover:scale-105"
          />
        )}
      </div>
      <div className="flex flex-1 flex-col p-6">
        <p className="eyebrow">
          {ARTICLE_TYPE_LABELS[article.type]} · {formatDate(article.publishedAt)}
        </p>
        <h3 className="mt-2 font-display text-2xl leading-tight">{article.title}</h3>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted">{article.excerpt}</p>
        <p className="mt-auto pt-4 text-xs text-muted">Par {joinNames(article.authors.map((a) => a.firstName))}</p>
      </div>
    </Link>
  );
}
