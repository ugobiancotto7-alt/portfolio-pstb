/**
 * Route /api/v1/search?q=observabilité : recherche plein texte.
 *
 * On utilise la recherche intégrée de PostgreSQL :
 *  - websearch_to_tsquery comprend une syntaxe "à la Google"
 *    (guillemets pour une expression exacte, "-mot" pour exclure) ;
 *  - la configuration 'french' gère les pluriels et conjugaisons
 *    ("projets" trouve "projet") ;
 *  - ts_rank trie par pertinence, ts_headline surligne les mots trouvés.
 * Plus tard (bonus IA), on pourra ajouter une recherche "sémantique"
 * avec des embeddings et l'extension pgvector.
 */
import { Router } from "express";
import { z } from "zod";
import { query } from "../db.js";
import { articleSummaryColumns } from "../lib/sql.js";

export const searchRouter = Router();

const querySchema = z.object({ q: z.string().trim().min(2).max(200) });

searchRouter.get("/", async (req, res) => {
  const { q } = querySchema.parse(req.query);
  const results = await query(
    `with q as (select websearch_to_tsquery('french', $1) as query)
     select ${articleSummaryColumns},
       ts_rank(a.search, q.query) as rank,
       ts_headline('french', a.content, q.query,
         'StartSel=<mark>, StopSel=</mark>, MaxWords=30, MinWords=10') as highlight
     from articles a, q
     where a.status = 'published' and a.search @@ q.query
     order by rank desc
     limit 20`,
    [q],
  );
  res.json(results);
});
