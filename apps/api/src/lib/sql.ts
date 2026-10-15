/**
 * Fragments SQL réutilisés par plusieurs routes.
 *
 * PostgreSQL sait fabriquer du JSON directement (json_build_object,
 * json_agg). On s'en sert pour renvoyer en UNE requête un article avec
 * ses auteurs et ses photos déjà imbriqués, au bon format camelCase.
 */

/** Un membre résumé au format MemberSummary. `alias` = nom de la table dans la requête. */
export const memberSummaryJson = (alias: string) => `json_build_object(
  'id', ${alias}.id,
  'slug', ${alias}.slug,
  'firstName', ${alias}.first_name,
  'lastName', ${alias}.last_name,
  'role', ${alias}.role,
  'avatarUrl', ${alias}.avatar_url
)`;

/** Sous-requête : la liste des auteurs d'un article `a`. */
export const articleAuthorsJson = `coalesce((
  select json_agg(${memberSummaryJson("m")} order by m.first_name)
  from article_authors aa join members m on m.id = aa.member_id
  where aa.article_id = a.id
), '[]'::json)`;

/** Colonnes d'un ArticleSummary pour une table aliasée `a`. */
export const articleSummaryColumns = `
  a.id, a.slug, a.title, a.excerpt,
  a.cover_url as "coverUrl",
  a.type,
  a.published_at as "publishedAt",
  ${articleAuthorsJson} as authors`;

/** Sous-requête : les photos d'un propriétaire (article, projet…). */
export const photosJson = (ownerColumn: "article_id" | "project_id" | "event_id", ownerId: string) => `coalesce((
  select json_agg(json_build_object(
    'id', ph.id, 'url', ph.url, 'alt', ph.alt, 'caption', ph.caption, 'position', ph.position
  ) order by ph.position)
  from photos ph where ph.${ownerColumn} = ${ownerId}
), '[]'::json)`;
