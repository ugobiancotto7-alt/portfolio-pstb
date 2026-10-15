/** Routes /api/v1/events : événements auxquels l'équipe a participé. */
import { Router } from "express";
import type { EventItem } from "@pstb/shared";
import { query, queryOne } from "../db.js";
import { notFound } from "../lib/http.js";
import { memberSummaryJson } from "../lib/sql.js";

export const eventsRouter = Router();

const EVENT_SELECT = `
  select e.id, e.slug, e.title, e.description,
    e.starts_on as "startsOn", e.ends_on as "endsOn", e.location, e.url,
    coalesce((
      select json_agg(${memberSummaryJson("m")} order by m.first_name)
      from event_participants ep join members m on m.id = ep.member_id
      where ep.event_id = e.id
    ), '[]'::json) as participants
  from events e`;

eventsRouter.get("/", async (_req, res) => {
  res.json(await query<EventItem>(EVENT_SELECT + ` order by e.starts_on desc`));
});

eventsRouter.get("/:slug", async (req, res) => {
  const event = await queryOne<EventItem>(EVENT_SELECT + ` where e.slug = $1`, [req.params.slug]);
  if (!event) throw notFound("Événement");
  res.json(event);
});
