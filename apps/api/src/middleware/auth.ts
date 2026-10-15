/**
 * Protection de l'espace admin.
 *
 * Comment ça marche :
 * 1. Le membre se connecte sur le site (ou l'app mobile) via Supabase Auth.
 *    Supabase lui donne un "access token" (un JWT signé).
 * 2. Le client envoie ce token à notre API dans l'en-tête :
 *       Authorization: Bearer <token>
 * 3. Ce middleware demande à Supabase "à qui appartient ce token ?",
 *    puis vérifie que cet e-mail correspond à un membre admin dans NOTRE
 *    table members. Être inscrit sur Supabase ne suffit donc pas : il faut
 *    être l'un des 3 membres.
 *
 * Le même mécanisme marchera tel quel pour l'app mobile.
 */
import type { NextFunction, Request, Response } from "express";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { config } from "../config.js";
import { queryOne } from "../db.js";
import { HttpError } from "../lib/http.js";

export interface AuthMember {
  id: string;
  slug: string;
  firstName: string;
  email: string;
}

// On ajoute une propriété "member" au type Request d'Express.
declare module "express-serve-static-core" {
  interface Request {
    member?: AuthMember;
  }
}

let supabase: SupabaseClient | null = null;
if (config.SUPABASE_URL && config.SUPABASE_ANON_KEY) {
  supabase = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });
}

export async function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!supabase) {
    throw new HttpError(503, "Authentification non configurée (SUPABASE_URL / SUPABASE_ANON_KEY manquants)");
  }

  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;
  if (!token) throw new HttpError(401, "Connexion requise");

  const { data, error } = await supabase.auth.getUser(token);
  const email = data.user?.email;
  if (error || !email) throw new HttpError(401, "Session invalide ou expirée");

  const member = await queryOne<AuthMember>(
    `select id, slug, first_name as "firstName", email
     from members
     where lower(email) = lower($1) and is_admin`,
    [email],
  );
  if (!member) throw new HttpError(403, "Ce compte n'est pas un membre de l'équipe");

  req.member = member;
  next();
}
