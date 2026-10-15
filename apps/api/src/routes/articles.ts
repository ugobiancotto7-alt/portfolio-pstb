/**
 * Routes /api/v1/articles : articles et comptes rendus.
 *
 *   GET    /articles          liste paginée des articles publiés (public)
 *   GET    /articles/:slug    un article publié, avec auteurs et galerie (public)
 *   POST   /articles          créer (admin)
 *   PUT    /articles/:id      modifier (admin)
 *   DELETE /articles/:id      supprimer (admin)
 */
import { Router } from "express";
import {
  articleInputSchema,
  articleListQuerySchema,
  type Article,
  type ArticleInput,
  type ArticleSummary,
  type Paginated,
} from "@pstb/shared";
import type { PoolClient } from "pg";
import { query, queryOne, transaction } from "../db.js";
import { notFound } from "../lib/http.js";
import { articleSummaryColumns, photosJson } from "../lib/sql.js";
import { requireAdmin } from "../middleware/auth.js";

export const articlesRouter = Router();

articlesRouter.get("/", async (req, res) => {
  // zod transforme et valide la query string (?page=2 arrive en texte "2")
  const { page, pageSize, type } = articleListQuerySchema.parse(req.query);

  const where = `where a.status = 'published' and ($1::article_type is null or a.type = $1)`;
  const [items, countRow] = await Promise.all([
    query<ArticleSummary>(
      `select ${articleSummaryColumns}
       from articles a ${where}
       order by a.published_at desc nulls last
       limit $2 offset $3`,
      [type ?? null, pageSize, (page - 1) * pageSize],
    ),
    queryOne<{ total: number }>(`select count(*)::int as total from articles a ${where}`, [type ?? null]),
  ]);

  const body: Paginated<ArticleSummary> = { items, page, pageSize, total: countRow?.total ?? 0 };
  res.json(body);
});

articlesRouter.get("/:slug", async (req, res) => {
  const article = await queryOne<Article>(
    `select ${articleSummaryColumns},
       a.content, a.status,
       case when e.id is null then null else json_build_object(
         'id', e.id, 'slug', e.slug, 'title', e.title, 'startsOn', e.starts_on, 'location', e.location
       ) end as event,
       ${photosJson("article_id", "a.id")} as photos
     from articles a
     left join events e on e.id = a.event_id
     where a.slug = $1 and a.status = 'published'`,
    [req.params.slug],
  );
  if (!article) throw notFound("Article");
  res.json(article);
});

// ----------------------------- Admin ---------------------------------

articlesRouter.post("/", requireAdmin, async (req, res) => {
  const input = articleInputSchema.parse(req.body);
  const id = await transaction(async (client) => {
    const { rows } = await client.query<{ id: string }>(
      `insert into articles (slug, title, excerpt, content, cover_url, type, status, published_at, event_id, project_id)
       values ($1, $2, $3, $4, $5, $6, $7, case when $7 = 'published' then now() end, $8, $9)
       returning id`,
      [input.slug, input.title, input.excerpt, input.content, input.coverUrl ?? null,
       input.type, input.status, input.eventId ?? null, input.projectId ?? null],
    );
    await setAuthors(client, rows[0].id, input);
    return rows[0].id;
  });
  res.status(201).json({ id });
});

articlesRouter.put("/:id", requireAdmin, async (req, res) => {
  const input = articleInputSchema.parse(req.body);
  await transaction(async (client) => {
    const { rowCount } = await client.query(
      `update articles set
         slug = $2, title = $3, excerpt = $4, content = $5, cover_url = $6, type = $7, status = $8,
         -- on date la publication la première fois qu'on passe en "published"
         published_at = case when $8 = 'published' then coalesce(published_at, now()) else published_at end,
         event_id = $9, project_id = $10
       where id = $1`,
      [req.params.id, input.slug, input.title, input.excerpt, input.content, input.coverUrl ?? null,
       input.type, input.status, input.eventId ?? null, input.projectId ?? null],
    );
    if (rowCount === 0) throw notFound("Article");
    await setAuthors(client, req.params.id as string, input);
  });
  res.status(204).end();
});

articlesRouter.delete("/:id", requireAdmin, async (req, res) => {
  const rows = await query(`delete from articles where id = $1 returning id`, [req.params.id]);
  if (rows.length === 0) throw notFound("Article");
  res.status(204).end();
});

/** Remplace la liste des auteurs d'un article. */
async function setAuthors(client: PoolClient, articleId: string, input: ArticleInput) {
  await client.query(`delete from article_authors where article_id = $1`, [articleId]);
  await client.query(
    `insert into article_authors (article_id, member_id) select $1, unnest($2::uuid[])`,
    [articleId, input.authorIds],
  );
}
