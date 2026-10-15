/**
 * @pstb/shared : le "contrat" entre l'API et ses clients.
 *
 * Ce paquet est importé par :
 *   - apps/api    (pour valider ce qui arrive dans les requêtes)
 *   - apps/web    (pour typer ce que renvoie l'API)
 *   - apps/mobile (plus tard, l'app Expo réutilisera exactement les mêmes types)
 *
 * On décrit chaque objet avec zod : un schéma zod sert à la fois de
 * validation à l'exécution (`schema.parse(data)`) et de type TypeScript
 * (`z.infer<typeof schema>`). Une seule source de vérité.
 */
import { z } from "zod";

// ---------------------------------------------------------------------
// Petits schémas réutilisables
// ---------------------------------------------------------------------
export const slugSchema = z
  .string()
  .min(2)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "minuscules, chiffres et tirets uniquement");

const isoDate = z.iso.date(); // "2026-10-15"
const optionalUrl = z.url().nullable().optional();

export const ARTICLE_TYPES = ["event_report", "project", "course", "other"] as const;
export const PUBLISH_STATUSES = ["draft", "published"] as const;
export const SKILL_CATEGORIES = ["language", "data", "ai", "tool", "soft"] as const;

export type ArticleType = (typeof ARTICLE_TYPES)[number];
export type PublishStatus = (typeof PUBLISH_STATUSES)[number];
export type SkillCategory = (typeof SKILL_CATEGORIES)[number];

/** Libellés français, partagés entre le site et l'app mobile. */
export const ARTICLE_TYPE_LABELS: Record<ArticleType, string> = {
  event_report: "Compte rendu d'événement",
  project: "Projet",
  course: "Cours marquant",
  other: "Article",
};

// ---------------------------------------------------------------------
// Objets renvoyés par l'API (lecture)
// ---------------------------------------------------------------------
export interface MemberSummary {
  id: string;
  slug: string;
  firstName: string;
  lastName: string | null;
  role: string | null;
  avatarUrl: string | null;
}

export interface Skill {
  id: string;
  slug: string;
  name: string;
  category: SkillCategory;
}

export interface MemberSkill extends Skill {
  level: number;
  acquiredOn: string | null;
}

export interface Member extends MemberSummary {
  bio: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  skills: MemberSkill[];
}

export interface Photo {
  id: string;
  /** null = emplacement vide, la photo sera ajoutée plus tard */
  url: string | null;
  alt: string;
  caption: string | null;
  position: number;
}

export interface EventItem {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  startsOn: string;
  endsOn: string | null;
  location: string | null;
  url: string | null;
  participants: MemberSummary[];
}

export interface ArticleSummary {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverUrl: string | null;
  type: ArticleType;
  publishedAt: string | null;
  authors: MemberSummary[];
}

export interface Article extends ArticleSummary {
  content: string;
  status: PublishStatus;
  event: Pick<EventItem, "id" | "slug" | "title" | "startsOn" | "location"> | null;
  photos: Photo[];
}

export interface ProjectSummary {
  id: string;
  slug: string;
  title: string;
  summary: string;
  coverUrl: string | null;
  startedOn: string | null;
  technologies: Skill[];
}

export interface Project extends ProjectSummary {
  description: string | null;
  results: string | null;
  githubUrl: string | null;
  demoUrl: string | null;
  endedOn: string | null;
  hoursSpent: number | null;
  members: MemberSummary[];
  photos: Photo[];
}

export type TimelineKind = "event" | "article" | "project" | "milestone";

export interface TimelineEntry {
  kind: TimelineKind;
  id: string;
  slug: string | null;
  title: string;
  summary: string | null;
  date: string;
}

/** Une liste paginée : même forme pour toutes les listes de l'API. */
export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

// ---------------------------------------------------------------------
// Ce que l'admin envoie à l'API (écriture) : validé côté serveur
// ET côté formulaire, avec le même schéma.
// ---------------------------------------------------------------------
export const articleInputSchema = z.object({
  slug: slugSchema,
  title: z.string().min(3).max(200),
  excerpt: z.string().min(10).max(400),
  content: z.string().min(1),
  coverUrl: optionalUrl,
  type: z.enum(ARTICLE_TYPES),
  status: z.enum(PUBLISH_STATUSES),
  eventId: z.uuid().nullable().optional(),
  projectId: z.uuid().nullable().optional(),
  authorIds: z.array(z.uuid()).min(1, "au moins un auteur"),
});
export type ArticleInput = z.infer<typeof articleInputSchema>;

export const eventInputSchema = z.object({
  slug: slugSchema,
  title: z.string().min(3).max(200),
  description: z.string().nullable().optional(),
  startsOn: isoDate,
  endsOn: isoDate.nullable().optional(),
  location: z.string().nullable().optional(),
  url: optionalUrl,
  participantIds: z.array(z.uuid()).default([]),
});
export type EventInput = z.infer<typeof eventInputSchema>;

export const projectInputSchema = z.object({
  slug: slugSchema,
  title: z.string().min(3).max(200),
  summary: z.string().min(10).max(400),
  description: z.string().nullable().optional(),
  results: z.string().nullable().optional(),
  githubUrl: optionalUrl,
  demoUrl: optionalUrl,
  coverUrl: optionalUrl,
  status: z.enum(PUBLISH_STATUSES),
  startedOn: isoDate.nullable().optional(),
  endedOn: isoDate.nullable().optional(),
  hoursSpent: z.number().int().min(0).nullable().optional(),
  memberIds: z.array(z.uuid()).default([]),
  skillIds: z.array(z.uuid()).default([]),
});
export type ProjectInput = z.infer<typeof projectInputSchema>;

export const memberInputSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().nullable().optional(),
  role: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  avatarUrl: optionalUrl,
  linkedinUrl: optionalUrl,
  githubUrl: optionalUrl,
});
export type MemberInput = z.infer<typeof memberInputSchema>;

/** Paramètres de la liste des articles : ?page=2&type=event_report */
export const articleListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
  type: z.enum(ARTICLE_TYPES).optional(),
});
