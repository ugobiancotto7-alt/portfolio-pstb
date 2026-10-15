import Link from "next/link";
import { ARTICLE_TYPE_LABELS, type ArticleSummary } from "@pstb/shared";
import { formatDate, joinNames } from "@/lib/format";

export function ArticleCard({ article }: { article: ArticleSummary }) {
  return (
    <Link
      href={`/articles/${article.slug}`}
      className="group flex flex-col rounded-2xl border border-border bg-surface p-6 transition hover:-translate-y-0.5 hover:border-brand-500/50 hover:shadow-lg hover:shadow-brand-500/5"
    >
      <span className="text-xs font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">
        {ARTICLE_TYPE_LABELS[article.type]}
      </span>
      <h3 className="mt-2 text-lg font-bold tracking-tight group-hover:text-brand-600 dark:group-hover:text-brand-400">
        {article.title}
      </h3>
      <p className="mt-2 line-clamp-3 text-sm text-muted">{article.excerpt}</p>
      <p className="mt-auto pt-4 text-xs text-muted">
        {formatDate(article.publishedAt)} · {joinNames(article.authors.map((a) => a.firstName))}
      </p>
    </Link>
  );
}
