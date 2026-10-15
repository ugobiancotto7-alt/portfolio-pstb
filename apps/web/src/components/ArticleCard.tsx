import Image from "next/image";
import Link from "next/link";
import { ARTICLE_TYPE_LABELS, type ArticleSummary } from "@pstb/shared";
import { formatDate, joinNames } from "@/lib/format";

export function ArticleCard({ article }: { article: ArticleSummary }) {
  return (
    <Link href={`/articles/${article.slug}`} className="group flex flex-col">
      <div className="relative aspect-[4/3] overflow-hidden bg-sunken">
        {article.coverUrl && (
          <Image
            src={article.coverUrl}
            alt=""
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        )}
      </div>
      <p className="eyebrow mt-5">
        {ARTICLE_TYPE_LABELS[article.type]} · {formatDate(article.publishedAt)}
      </p>
      <h3 className="mt-2 font-display text-3xl leading-tight">{article.title}</h3>
      <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted">{article.excerpt}</p>
      <p className="mt-4 text-xs text-muted">Par {joinNames(article.authors.map((a) => a.firstName))}</p>
    </Link>
  );
}
