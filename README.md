# Portfolio PSTB · Data & IA

Le journal de bord de **Ugo, Tim et Marcelo**, étudiants en Bachelor Data & IA à la Paris School of Technology & Business : équipe, timeline, articles, projets, et bientôt un espace admin, un tableau de bord et une app mobile.

- Architecture, modèle de données, routes et plan de travail : [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- Comprendre le code de l'étape 1 : [section plus bas](#comprendre-le-code-étape-1)

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · Express 5 · PostgreSQL (Supabase) · zod · npm workspaces

```
apps/web        site Next.js          -> http://localhost:3000
apps/api        API REST Express      -> http://localhost:4000/api/v1
packages/shared types et validation partagés (web, api, futur mobile)
```

## Installation en local

Prérequis : **Node.js 22+** et une base **PostgreSQL** (au choix : PostgreSQL installé sur votre machine, Docker, ou directement un projet Supabase gratuit).

```bash
# 1. Récupérer le code et installer toutes les dépendances (les 3 paquets d'un coup)
git clone <url-du-depot> portfolio-pstb
cd portfolio-pstb
npm install

# 2. Configurer l'API
cp apps/api/.env.example apps/api/.env
#    puis éditer DATABASE_URL dans apps/api/.env

# 3. Créer les tables et les données de départ
npm run db:reset

# 4. Configurer le site
cp apps/web/.env.example apps/web/.env.local

# 5. Lancer l'API et le site (deux terminaux)
npm run dev:api
npm run dev:web
```

Ouvrir http://localhost:3000. Pour vérifier l'API seule : http://localhost:4000/api/v1/articles

Avec Docker, une base PostgreSQL prête en une commande :

```bash
docker run -d --name pstb-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=portfolio -p 5432:5432 postgres:16
```

Commandes utiles :

| Commande | Effet |
|---|---|
| `npm run db:reset` | Supprime et recrée toutes les tables, puis remet les données de départ |
| `npm run typecheck` | Vérifie les types TypeScript des 3 paquets |
| `npm run build` | Construit le site pour la production |
| `npm run format` | Met en forme le code automatiquement (Prettier) |

## Déploiement (gratuit)

1. **Supabase** (base, auth, fichiers) : créer un projet sur supabase.com, ouvrir *SQL Editor* et exécuter `apps/api/db/schema.sql` puis `apps/api/db/seed.sql`. Dans *Authentication > Users*, créer les 3 comptes, puis renseigner les mêmes e-mails dans la table `members`.
2. **Render** (API) : *New > Web Service*, connecter le dépôt GitHub. Root directory : vide. Build : `npm install`. Start : `npm start --workspace=apps/api`. Variables : `DATABASE_URL` (Supabase > Connect > *Session pooler*), `CORS_ORIGINS` (l'URL Vercel), `SUPABASE_URL`, `SUPABASE_ANON_KEY`.
3. **Vercel** (site) : importer le dépôt, *Root Directory* = `apps/web`, variable `NEXT_PUBLIC_API_URL` = `https://<votre-api>.onrender.com/api/v1`.

Le détail (CI, nom de domaine) viendra à l'étape 5.

---

## Comprendre le code (étape 1)

### Le trajet d'une page, du clic à la base de données

Quand on ouvre `/articles/compte-rendu-datadog-summit-paris-2026` :

1. **Next.js** trouve le fichier `apps/web/src/app/articles/[slug]/page.tsx`. Le dossier `[slug]` capture la fin de l'URL.
2. Ce composant est un **Server Component** : il tourne sur le serveur, il peut être `async` et appeler `api.article(slug)` (`apps/web/src/lib/api.ts`).
3. `api.article` fait un `fetch` vers `GET /api/v1/articles/:slug`.
4. **Express** dirige la requête vers `apps/api/src/routes/articles.ts`.
5. La route exécute **une seule requête SQL** qui renvoie l'article, ses auteurs et ses photos déjà imbriqués en JSON (`json_build_object`, `json_agg`, voir `apps/api/src/lib/sql.ts`).
6. Next.js transforme le résultat en HTML et l'envoie au navigateur. La réponse reste en cache 60 secondes.

### Les idées importantes, fichier par fichier

**`apps/api/db/schema.sql`** : le cœur du projet.
- Les tables de liaison (`article_authors`, `member_skills`…) représentent les relations « plusieurs à plusieurs ».
- La **vue `timeline`** assemble événements, articles, projets et jalons avec `UNION ALL`. Publier un article l'ajoute donc automatiquement à la timeline, sans code supplémentaire.
- La colonne **`search`** des articles est un `tsvector` calculé par PostgreSQL : c'est un index de recherche plein texte en français (« projets » trouve « projet »).
- Dans `photos`, **`url` à `null` signifie emplacement vide**. La galerie du Datadog Summit contient 6 emplacements de ce type, à remplir depuis l'admin.

**`packages/shared/src/index.ts`** : le contrat entre l'API et ses clients. Un schéma **zod** sert à la fois à valider les données reçues et à générer le type TypeScript. Le formulaire admin (étape 3) et l'app mobile utiliseront exactement les mêmes règles.

**`apps/api/src/db.ts`** : on passe toujours les valeurs avec `$1, $2…`, jamais en les collant dans le texte SQL. C'est ce qui protège des **injections SQL**.

**`apps/api/src/middleware/auth.ts`** : pour modifier du contenu, il faut un token Supabase valide **et** que l'e-mail corresponde à un membre de la table `members`. Créer un compte Supabase ne suffit donc pas pour devenir admin.

**`apps/api/src/middleware/errors.ts`** : toutes les erreurs arrivent ici et ressortent au même format JSON. Une donnée invalide donne un code 400 avec le détail champ par champ.

**`apps/web/src/app/globals.css`** : les couleurs sont des **variables CSS** qui changent quand la classe `dark` est posée sur `<html>`. Les composants n'écrivent `bg-surface` ou `text-muted` qu'une fois, et ça marche dans les deux thèmes.

**`apps/web/src/components/Header.tsx`** : exemple de **mobile first**. Le menu « bureau » est `hidden` par défaut et n'apparaît qu'à partir de `md:` (écrans de 768 px et plus).

**`apps/web/src/lib/enhance.ts`** : toutes les interactions (sphère neuronale 3D, cartes qui s'inclinent, menu plein écran, surligneur du menu). C'est du JavaScript pur branché sur des attributs `data-*` : la sphère 3D est dessinée sans librairie, en faisant tourner des points avec des formules de rotation puis en les projetant en 2D avec une perspective (`x' = x × f / (f + z)`). C'est le principe de base de tous les moteurs 3D.

### Exercices pour s'approprier le code

1. Ajoutez votre nom de famille, votre rôle et votre LinkedIn dans `seed.sql`, relancez `npm run db:reset` et regardez `/equipe`.
2. Ajoutez 3 compétences par personne dans `member_skills` (niveau 1 à 5) : elles apparaissent sur la page équipe et dans `/api/v1/stats`.
3. Testez la recherche : http://localhost:4000/api/v1/search?q=incidents
4. Ajoutez un jalon « Rentrée 2026 » dans `milestones` et vérifiez qu'il apparaît dans la timeline.
