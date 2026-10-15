/**
 * Lecture et validation des variables d'environnement.
 *
 * Pourquoi valider ? Si DATABASE_URL est oublié, on préfère que l'API
 * refuse de démarrer avec un message clair, plutôt que de planter plus
 * tard au premier appel.
 */
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().default(4000),
  DATABASE_URL: z.string({ error: "DATABASE_URL est obligatoire" }).min(1, "DATABASE_URL est obligatoire"),
  CORS_ORIGINS: z.string().default("http://localhost:3000"),
  // Optionnelles : sans elles, l'API marche en lecture seule.
  SUPABASE_URL: z.string().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("Configuration invalide :", z.prettifyError(parsed.error));
  process.exit(1);
}

export const config = {
  ...parsed.data,
  corsOrigins: parsed.data.CORS_ORIGINS.split(",").map((o) => o.trim()),
};
