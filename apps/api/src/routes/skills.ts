/** Route /api/v1/skills : toutes les compétences connues. */
import { Router } from "express";
import type { Skill } from "@pstb/shared";
import { query } from "../db.js";

export const skillsRouter = Router();

skillsRouter.get("/", async (_req, res) => {
  res.json(await query<Skill>(`select id, slug, name, category from skills order by category, name`));
});
