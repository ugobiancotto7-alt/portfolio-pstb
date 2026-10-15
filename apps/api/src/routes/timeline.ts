/**
 * Route /api/v1/timeline : la progression de l'année, mois par mois.
 * Tout le travail est fait par la VUE SQL "timeline" (voir db/schema.sql).
 * Le client regroupe ensuite par mois pour l'affichage.
 */
import { Router } from "express";
import { z } from "zod";
import type { TimelineEntry } from "@pstb/shared";
import { query } from "../db.js";

export const timelineRouter = Router();

const querySchema = z.object({
  from: z.iso.date().optional(), // ex. ?from=2026-09-01&to=2027-08-31
  to: z.iso.date().optional(),
});

timelineRouter.get("/", async (req, res) => {
  const { from, to } = querySchema.parse(req.query);
  const entries = await query<TimelineEntry>(
    `select kind, id, slug, title, summary, date::text as date
     from timeline
     where ($1::date is null or date >= $1) and ($2::date is null or date <= $2)
     order by date desc, kind`,
    [from ?? null, to ?? null],
  );
  res.json(entries);
});
