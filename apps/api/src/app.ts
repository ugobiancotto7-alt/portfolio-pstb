/**
 * Construction de l'application Express (sans la démarrer).
 * Séparer "app" et "index" permet plus tard de tester l'app sans ouvrir de port.
 */
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { config } from "./config.js";
import { errorHandler, notFoundHandler } from "./middleware/errors.js";
import { articlesRouter } from "./routes/articles.js";
import { eventsRouter } from "./routes/events.js";
import { meRouter } from "./routes/me.js";
import { membersRouter } from "./routes/members.js";
import { projectsRouter } from "./routes/projects.js";
import { searchRouter } from "./routes/search.js";
import { skillsRouter } from "./routes/skills.js";
import { statsRouter } from "./routes/stats.js";
import { timelineRouter } from "./routes/timeline.js";

export function createApp() {
  const app = express();

  app.use(helmet()); // en-têtes HTTP de sécurité
  app.use(cors({ origin: config.corsOrigins })); // qui a le droit d'appeler l'API depuis un navigateur
  app.use(express.json({ limit: "1mb" })); // lit le corps JSON des requêtes

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Toutes les routes sont versionnées (/api/v1). Le jour où on change un
  // format, on crée /api/v2 sans casser l'app mobile déjà installée.
  const v1 = express.Router();
  v1.use("/members", membersRouter);
  v1.use("/skills", skillsRouter);
  v1.use("/events", eventsRouter);
  v1.use("/articles", articlesRouter);
  v1.use("/projects", projectsRouter);
  v1.use("/timeline", timelineRouter);
  v1.use("/search", searchRouter);
  v1.use("/stats", statsRouter);
  v1.use("/me", meRouter);
  app.use("/api/v1", v1);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
