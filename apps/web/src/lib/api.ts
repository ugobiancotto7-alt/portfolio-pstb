/**
 * Petit client pour appeler notre API REST depuis Next.js.
 *
 * Ces fonctions tournent côté SERVEUR (dans les Server Components) :
 * le navigateur reçoit directement le HTML déjà rempli, ce qui est rapide
 * et bon pour le référencement.
 *
 * `next: { revalidate: 60 }` = Next garde la réponse en cache 60 secondes
 * (ISR). Le site reste rapide même si l'API (hébergée gratuitement) est
 * lente à se réveiller.
 */
import type {
  Article,
  ArticleSummary,
  ArticleType,
  EventItem,
  Member,
  Paginated,
  ProjectSummary,
  TimelineEntry,
} from "@pstb/shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { next: { revalidate: 60 } });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(res.status, body?.error?.message ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

/** Comme get, mais renvoie null sur une 404 (pratique pour notFound()). */
async function getOrNull<T>(path: string): Promise<T | null> {
  try {
    return await get<T>(path);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

/** Chiffres du tableau de bord (route /stats). */
export interface Stats {
  totals: { articles: number; projects: number; events: number; skills: number; hours: number };
  articlesPerMonth: { month: string; count: number }[];
}

export const api = {
  stats: () => get<Stats>("/stats"),
  members: () => get<Member[]>("/members"),
  member: (slug: string) => getOrNull<Member>(`/members/${encodeURIComponent(slug)}`),
  articles: (params: { page?: number; type?: ArticleType } = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set("page", String(params.page));
    if (params.type) qs.set("type", params.type);
    return get<Paginated<ArticleSummary>>(`/articles?${qs}`);
  },
  article: (slug: string) => getOrNull<Article>(`/articles/${encodeURIComponent(slug)}`),
  events: () => get<EventItem[]>("/events"),
  projects: () => get<ProjectSummary[]>("/projects"),
  timeline: () => get<TimelineEntry[]>("/timeline"),
};
