/**
 * Routes /api/v1/members : l'équipe.
 */
import { Router } from "express";
import type { Member } from "@pstb/shared";
import { query, queryOne } from "../db.js";
import { notFound } from "../lib/http.js";

export const membersRouter = Router();

// GET /api/v1/members -> liste des membres avec leurs compétences
membersRouter.get("/", async (_req, res) => {
  const members = await query<Member>(MEMBER_SELECT + ` order by m.first_name`);
  res.json(members);
});

// GET /api/v1/members/ugo -> un membre
membersRouter.get("/:slug", async (req, res) => {
  const member = await queryOne<Member>(MEMBER_SELECT + ` where m.slug = $1`, [req.params.slug]);
  if (!member) throw notFound("Membre");
  res.json(member);
});

// Remarque : on ne renvoie JAMAIS l'e-mail des membres dans l'API publique.
const MEMBER_SELECT = `
  select
    m.id, m.slug,
    m.first_name as "firstName", m.last_name as "lastName",
    m.role, m.bio,
    m.avatar_url as "avatarUrl",
    m.linkedin_url as "linkedinUrl",
    m.github_url as "githubUrl",
    coalesce((
      select json_agg(json_build_object(
        'id', s.id, 'slug', s.slug, 'name', s.name, 'category', s.category,
        'level', ms.level, 'acquiredOn', ms.acquired_on
      ) order by ms.level desc, s.name)
      from member_skills ms join skills s on s.id = ms.skill_id
      where ms.member_id = m.id
    ), '[]'::json) as skills
  from members m`;
