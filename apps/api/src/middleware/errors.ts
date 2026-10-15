/**
 * Gestion centralisée des erreurs.
 *
 * Express 5 attrape automatiquement les erreurs des fonctions async : il
 * suffit de faire "throw" dans une route et on arrive ici. On renvoie
 * toujours le même format JSON : { error: { message, details? } }.
 * L'app mobile pourra donc afficher les erreurs de façon uniforme.
 */
import type { NextFunction, Request, Response } from "express";
import { ZodError, z } from "zod";
import { HttpError } from "../lib/http.js";

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: { message: `Route inconnue : ${req.method} ${req.path}` } });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    res.status(400).json({ error: { message: "Données invalides", details: z.flattenError(err) } });
    return;
  }
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: { message: err.message, details: err.details } });
    return;
  }
  // Violation d'unicité PostgreSQL (ex. slug déjà utilisé)
  if (typeof err === "object" && err && "code" in err && err.code === "23505") {
    res.status(409).json({ error: { message: "Cette valeur existe déjà (slug ou e-mail en double)" } });
    return;
  }
  console.error(err);
  res.status(500).json({ error: { message: "Erreur interne du serveur" } });
}
