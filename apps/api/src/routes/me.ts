/** Route /api/v1/me : "qui suis-je ?" pour l'espace admin connecté. */
import { Router } from "express";
import { requireAdmin } from "../middleware/auth.js";

export const meRouter = Router();

meRouter.get("/", requireAdmin, (req, res) => {
  res.json(req.member);
});
