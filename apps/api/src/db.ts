/**
 * Accès à PostgreSQL avec la librairie "pg".
 *
 * Un "Pool" garde quelques connexions ouvertes et les réutilise : ouvrir
 * une connexion à chaque requête HTTP serait lent.
 *
 * On écrit le SQL à la main (pas d'ORM) : en Data & IA, le SQL est une
 * compétence clé, et on voit exactement ce qui est envoyé à la base.
 * IMPORTANT : on ne concatène JAMAIS une valeur utilisateur dans le SQL.
 * On passe toujours par des paramètres $1, $2… : "pg" les échappe pour
 * nous, ce qui empêche les injections SQL.
 */
import pg from "pg";
import { config } from "./config.js";

// Par défaut "pg" transforme les colonnes DATE en objets Date JavaScript,
// avec des surprises de fuseau horaire. On les garde en texte "2026-10-15".
pg.types.setTypeParser(pg.types.builtins.DATE, (value) => value);

export const pool = new pg.Pool({
  connectionString: config.DATABASE_URL,
  // Supabase exige SSL ; en local on n'en a pas besoin.
  ssl: config.DATABASE_URL.includes("supabase") ? { rejectUnauthorized: false } : undefined,
  max: 5,
});

/** Exécute une requête et renvoie les lignes, typées. */
export async function query<T extends pg.QueryResultRow>(sql: string, params: unknown[] = []) {
  const result = await pool.query<T>(sql, params);
  return result.rows;
}

/** Comme query, mais renvoie la première ligne (ou null). */
export async function queryOne<T extends pg.QueryResultRow>(sql: string, params: unknown[] = []) {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

/**
 * Exécute plusieurs requêtes dans une TRANSACTION : soit tout réussit,
 * soit rien n'est enregistré (ex. créer un article ET ses auteurs).
 */
export async function transaction<T>(fn: (client: pg.PoolClient) => Promise<T>) {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const result = await fn(client);
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}
