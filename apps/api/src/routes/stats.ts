/**
 * Route /api/v1/stats : les chiffres du tableau de bord (bonus Data).
 * Chaque indicateur est une requête d'agrégation SQL (count, sum, group by).
 */
import { Router } from "express";
import { query, queryOne } from "../db.js";

export const statsRouter = Router();

statsRouter.get("/", async (_req, res) => {
  const [totals, articlesPerMonth, skillsByCategory, hoursPerMember] = await Promise.all([
    queryOne(
      `select
         (select count(*)::int from articles where status = 'published') as articles,
         (select count(*)::int from projects where status = 'published') as projects,
         (select count(*)::int from events) as events,
         (select count(distinct skill_id)::int from member_skills) as skills,
         (select coalesce(sum(hours), 0)::float from learning_logs) as hours`,
    ),
    // date_trunc('month', …) ramène chaque date au 1er du mois : on compte par mois
    query(
      `select to_char(date_trunc('month', published_at), 'YYYY-MM') as month, count(*)::int as count
       from articles where status = 'published'
       group by 1 order by 1`,
    ),
    query(
      `select s.category, count(distinct ms.skill_id)::int as count
       from member_skills ms join skills s on s.id = ms.skill_id
       group by s.category order by s.category`,
    ),
    query(
      `select m.first_name as member, coalesce(sum(l.hours), 0)::float as hours
       from members m left join learning_logs l on l.member_id = m.id
       group by m.id order by m.first_name`,
    ),
  ]);
  res.json({ totals, articlesPerMonth, skillsByCategory, hoursPerMember });
});
