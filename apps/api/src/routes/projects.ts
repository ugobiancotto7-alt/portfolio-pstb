/** Routes /api/v1/projects : projets Data & IA publiés. */
import { Router } from "express";
import type { Project, ProjectSummary } from "@pstb/shared";
import { query, queryOne } from "../db.js";
import { notFound } from "../lib/http.js";
import { memberSummaryJson, photosJson } from "../lib/sql.js";

export const projectsRouter = Router();

const technologiesJson = `coalesce((
  select json_agg(json_build_object('id', s.id, 'slug', s.slug, 'name', s.name, 'category', s.category) order by s.name)
  from project_skills ps join skills s on s.id = ps.skill_id
  where ps.project_id = p.id
), '[]'::json)`;

const SUMMARY_COLUMNS = `p.id, p.slug, p.title, p.summary,
  p.cover_url as "coverUrl", p.started_on as "startedOn",
  ${technologiesJson} as technologies`;

projectsRouter.get("/", async (_req, res) => {
  res.json(
    await query<ProjectSummary>(
      `select ${SUMMARY_COLUMNS} from projects p
       where p.status = 'published'
       order by p.started_on desc nulls last`,
    ),
  );
});

projectsRouter.get("/:slug", async (req, res) => {
  const project = await queryOne<Project>(
    `select ${SUMMARY_COLUMNS},
       p.description, p.results,
       p.github_url as "githubUrl", p.demo_url as "demoUrl",
       p.ended_on as "endedOn", p.hours_spent as "hoursSpent",
       coalesce((
         select json_agg(${memberSummaryJson("m")} order by m.first_name)
         from project_members pm join members m on m.id = pm.member_id
         where pm.project_id = p.id
       ), '[]'::json) as members,
       ${photosJson("project_id", "p.id")} as photos
     from projects p
     where p.slug = $1 and p.status = 'published'`,
    [req.params.slug],
  );
  if (!project) throw notFound("Projet");
  res.json(project);
});
