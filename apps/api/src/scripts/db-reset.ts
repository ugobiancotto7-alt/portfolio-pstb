/**
 * npm run db:reset : recrée toutes les tables puis insère les données de départ.
 * Équivalent de : psql $DATABASE_URL -f db/schema.sql -f db/seed.sql
 * (mais marche aussi sur Windows sans installer psql).
 */
import { readFile } from "node:fs/promises";
import { pool } from "../db.js";

const files = ["schema.sql", "seed.sql"];

for (const file of files) {
  const sql = await readFile(new URL(`../../db/${file}`, import.meta.url), "utf8");
  await pool.query(sql);
  console.log(`✓ ${file}`);
}
await pool.end();
