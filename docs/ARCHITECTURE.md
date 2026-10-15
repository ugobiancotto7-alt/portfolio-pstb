# Architecture du portfolio PSTB Data & IA

Ce document répond aux points 1 à 4 de la demande : architecture, modèle de données, pages et routes API, plan de travail à trois.

---

## 1. Architecture globale

### La stack retenue (et pourquoi)

| Besoin | Choix | Pourquoi |
|---|---|---|
| Front web | **Next.js 16 + React 19 + TypeScript + Tailwind CSS 4** | Votre proposition, elle est très bien. Rendu côté serveur = rapide et bon pour le SEO. |
| API | **Node.js + Express 5 + TypeScript** | Simple à comprendre, très répandu. Express 5 gère tout seul les erreurs `async`. NestJS est excellent mais apporte beaucoup de concepts d'un coup. |
| Accès BDD | **SQL écrit à la main avec `pg`** (pas d'ORM) | Le SQL est une compétence clé en Data. On voit exactement ce qui est envoyé à la base. |
| Base de données | **PostgreSQL hébergé sur Supabase** | Gratuit, PostgreSQL standard, et on a la recherche plein texte et `pgvector` (pour le bonus IA). |
| Auth admin | **Supabase Auth** + vérification dans l'API | On ne gère pas nous-mêmes les mots de passe (moins de risques). L'API n'accepte que les 3 membres. |
| Images | **Supabase Storage** | Même compte que la base, offre gratuite suffisante. Cloudinary reste possible si on veut redimensionner à la volée. |
| Validation / types partagés | **zod** dans un paquet `@pstb/shared` | Les mêmes types pour l'API, le site et la future app mobile. |
| Mobile (plus tard) | **Expo (React Native)** | Réutilise l'API et `@pstb/shared` tels quels. |
| Hébergement | **Vercel** (site) + **Render** (API) + **Supabase** (BDD, auth, fichiers) | Les trois ont une offre gratuite. |

Ce que j'ai challengé : on aurait pu tout faire avec Supabase seul (il génère une API automatiquement). C'est plus rapide, mais vous apprenez moins, la logique métier se retrouve éparpillée dans des règles SQL, et vous aviez explicitement demandé une API séparée. On garde donc une **vraie API REST** qui est la seule porte d'entrée vers les données.

Point d'attention : l'offre gratuite de Render **met l'API en veille** après 15 minutes sans visite (premier appel lent, ~30 s). Le site Next.js met les réponses en cache 60 s, ce qui masque une bonne partie du problème. Si ça gêne, Railway ou Fly.io coûtent quelques euros par mois.

### Schéma

```
                ┌──────────────────────┐        ┌──────────────────────┐
  Visiteur ───▶ │  Site Next.js        │        │  App mobile Expo     │  (plus tard)
                │  (Vercel)            │        │  (iOS / Android)     │
                └──────────┬───────────┘        └──────────┬───────────┘
                           │  HTTPS  /api/v1/...  (JSON)    │
                           └──────────────┬─────────────────┘
                                          ▼
                              ┌──────────────────────┐
                              │  API Express (Render)│── vérifie le token ──▶ Supabase Auth
                              │  validation zod      │
                              └──────────┬───────────┘
                                         │ SQL (pg)          ┌────────────────────┐
                                         ├──────────────────▶│ PostgreSQL (Supabase)
                                         │ upload            └────────────────────┘
                                         └──────────────────▶ Supabase Storage (photos)
```

### Arborescence (monorepo avec npm workspaces)

```
portfolio-pstb/
├── package.json              # déclare les "workspaces" ; scripts globaux
├── tsconfig.base.json        # réglages TypeScript communs
├── docs/ARCHITECTURE.md      # ce document
├── packages/
│   └── shared/               # @pstb/shared : types + schémas zod (web, api, mobile)
│       └── src/index.ts
├── apps/
│   ├── api/                  # @pstb/api : Express + PostgreSQL
│   │   ├── db/
│   │   │   ├── schema.sql    # toutes les tables, la vue timeline
│   │   │   └── seed.sql      # l'équipe, le Datadog Summit, le 1er article
│   │   └── src/
│   │       ├── index.ts      # démarre le serveur
│   │       ├── app.ts        # assemble les routes
│   │       ├── config.ts     # variables d'environnement validées
│   │       ├── db.ts         # pool de connexions, query(), transaction()
│   │       ├── lib/          # erreurs HTTP, fragments SQL réutilisables
│   │       ├── middleware/   # auth admin, gestion des erreurs
│   │       ├── routes/       # un fichier par ressource
│   │       └── scripts/db-reset.ts
│   ├── web/                  # @pstb/web : Next.js
│   │   ├── public/           # logo PSTB, images statiques
│   │   └── src/
│   │       ├── app/          # 1 dossier = 1 URL (App Router)
│   │       ├── components/   # Header, ArticleCard, Gallery…
│   │       └── lib/          # client API, formatage des dates
│   └── mobile/               # (étape 7) app Expo
```

---

## 2. Modèle de données

Le SQL complet et commenté est dans [`apps/api/db/schema.sql`](../apps/api/db/schema.sql).

```
members ──< member_skills >── skills ──< project_skills >── projects
   │                                                          │
   ├──< article_authors >── articles ──(event_id)──▶ events   ├──< project_members >── members
   ├──< event_participants >───────────────────────▶ events   │
   └──< learning_logs                                          │
                                                               │
photos ──▶ (article_id | project_id | event_id)  ◀─────────────┘
milestones (jalons libres)            vue "timeline" = events ∪ articles ∪ projects ∪ milestones
```

| Table | Rôle | Colonnes principales |
|---|---|---|
| `members` | Ugo, Tim, Marcelo | slug, first_name, last_name, role, bio, avatar_url, linkedin_url, github_url, **email** (connexion admin), is_admin |
| `skills` | Compétences / technologies | slug, name, category (`language`, `data`, `ai`, `tool`, `soft`) |
| `member_skills` | Qui maîtrise quoi | member_id, skill_id, level (1 à 5), acquired_on (pour la courbe de progression) |
| `events` | Salons, conférences, hackathons | slug, title, description, starts_on, ends_on, location, url |
| `event_participants` | Qui y est allé | event_id, member_id |
| `projects` | Projets Data & IA | slug, title, summary, description (Markdown), results, github_url, demo_url, cover_url, status, started_on, ended_on, hours_spent |
| `project_members`, `project_skills` | Équipe et technologies d'un projet | |
| `articles` | Articles et comptes rendus | slug, title, excerpt, content (Markdown), type (`event_report`, `project`, `course`, `other`), status (`draft`/`published`), published_at, event_id, project_id, **search** (index plein texte calculé automatiquement) |
| `article_authors` | Auteurs d'un article | article_id, member_id |
| `photos` | Galeries | url (**null = emplacement vide**), storage_path, alt, caption, position, et un seul propriétaire parmi article / projet / événement |
| `milestones` | Jalons de la timeline (rentrée, examens…) | title, description, happened_on |
| `learning_logs` | Heures d'apprentissage (tableau de bord) | member_id, logged_on, hours, topic |
| vue `timeline` | Timeline calculée, jamais saisie à la main | kind, id, slug, title, summary, date |

Choix notables :
- **UUID** comme clés : pas d'id devinable dans les URL, et l'app mobile pourra créer des objets hors ligne.
- **Slugs** dans les URL (`/articles/compte-rendu-datadog-summit-paris-2026`) : lisibles et bons pour le SEO.
- **Markdown** pour le contenu : facile à écrire dans l'admin, affichable aussi bien sur le web que sur mobile.
- **RLS activée sans règle** sur Supabase : personne ne peut contourner l'API en passant par l'API automatique de Supabase.

---

## 3. Pages du site et routes de l'API

### Pages

| URL | Contenu | État |
|---|---|---|
| `/` | Accueil : accroche, équipe, derniers articles | ✅ étape 1 |
| `/equipe` | Les 3 membres : photo, rôle, compétences, LinkedIn/GitHub | ✅ étape 1 |
| `/timeline` | Progression mois par mois | ✅ étape 1 |
| `/articles` | Liste des articles | ✅ étape 1 |
| `/articles/[slug]` | Un article + galerie | ✅ étape 1 |
| `/projets` | Liste des projets | ✅ étape 1 (liste simple) |
| `/projets/[slug]` | Détail d'un projet : technologies, résultats, visuels | étape 2 |
| `/recherche` | Recherche dans les articles | étape 2 |
| `/dashboard` | Tableau de bord avec graphiques | étape 4 |
| `/admin/login` | Connexion des membres | étape 3 |
| `/admin` | Tableau de bord admin | étape 3 |
| `/admin/articles`, `/admin/projets`, `/admin/evenements`, `/admin/membres`, `/admin/competences` | Listes + formulaires créer / modifier / supprimer | étape 3 |
| `/admin/photos` | Envoi de photos, remplissage des emplacements vides | étape 3 |

### API REST (`/api/v1`)

Toutes les réponses sont en JSON. Les erreurs ont toujours la forme `{ "error": { "message": "...", "details": ... } }`.

**Lecture, publique**

| Méthode | Route | Description | État |
|---|---|---|---|
| GET | `/health` | L'API est-elle en vie ? | ✅ |
| GET | `/members`, `/members/:slug` | Membres avec compétences (jamais l'e-mail) | ✅ |
| GET | `/skills` | Toutes les compétences | ✅ |
| GET | `/events`, `/events/:slug` | Événements et participants | ✅ |
| GET | `/articles?page=&pageSize=&type=` | Articles publiés, paginés | ✅ |
| GET | `/articles/:slug` | Article + auteurs + événement + photos | ✅ |
| GET | `/projects`, `/projects/:slug` | Projets publiés | ✅ |
| GET | `/timeline?from=&to=` | Entrées de la timeline | ✅ |
| GET | `/search?q=` | Recherche plein texte (français) avec extraits surlignés | ✅ |
| GET | `/stats` | Chiffres du tableau de bord | ✅ |

**Écriture, réservée aux membres** (en-tête `Authorization: Bearer <token Supabase>`)

| Méthode | Route | Description | État |
|---|---|---|---|
| GET | `/me` | Le membre connecté | ✅ |
| POST / PUT / DELETE | `/articles`, `/articles/:id` | Gérer les articles | ✅ |
| GET | `/admin/articles` (et autres listes) | Listes incluant les brouillons | étape 3 |
| POST / PUT / DELETE | `/projects`, `/events`, `/skills`, `/milestones` | Gérer le reste du contenu | étape 3 |
| PUT | `/members/:id`, `/members/:id/skills` | Modifier son profil et ses compétences | étape 3 |
| POST | `/photos` (multipart) | Envoyer une image vers Supabase Storage | étape 3 |
| PUT / DELETE | `/photos/:id` | Remplir un emplacement, changer la légende, supprimer | étape 3 |
| POST | `/learning-logs` | Noter des heures d'apprentissage | étape 4 |
| POST | `/ask` | Assistant IA sur nos articles | étape 6 |

---

## 4. Plan de développement à trois

Proposition de rôles, à ajuster selon vos envies :

- **Ugo, back-end et base de données** : API, SQL, authentification, déploiement de l'API.
- **Tim, front-end et design** : pages publiques, composants, responsive, mode sombre, admin côté interface.
- **Marcelo, data et IA** : tableau de bord, recherche, assistant IA, et contenu (articles, photos).

Chacun relit les pull requests des deux autres : c'est comme ça qu'on apprend le code des autres.

| Étape | Contenu | Ugo | Tim | Marcelo |
|---|---|---|---|---|
| **1. Socle** ✅ | Monorepo, BDD, API en lecture, pages publiques, 1er article | Relire `schema.sql` et l'API, créer le projet Supabase | Relire le front, ajuster les couleurs et textes | Relire et compléter le compte rendu, trier les photos |
| **2. Projets et recherche** | Page projet détaillée, filtres, page `/recherche` | Routes d'écriture des projets | Pages `/projets/[slug]` et `/recherche` | Saisir les premiers projets, tester la pertinence de la recherche |
| **3. Espace admin** | Connexion, formulaires, envoi de photos | Auth + routes admin + upload Storage | Pages `/admin/*` et formulaires (validés par `@pstb/shared`) | Remplir la galerie du Datadog Summit, profils, compétences |
| **4. Tableau de bord** | Graphiques de progression | Route `/learning-logs`, enrichir `/stats` | Intégration de la page dans le design | Choix des indicateurs et graphiques (Recharts) |
| **5. Mise en ligne** | Supabase, Render, Vercel, nom de domaine, CI GitHub Actions | Render + CI | Vercel + vérif mobile | Supabase + sauvegardes |
| **6. Bonus IA** | Recherche sémantique (pgvector) et assistant qui répond à partir de nos articles | Route `/ask` | Interface de chat | Embeddings, découpage des articles, évaluation des réponses |
| **7. App mobile** | App Expo qui consomme la même API | Ajustements API | Écrans principaux | Écran dashboard |

Règles d'équipe conseillées :
1. Une branche par fonctionnalité (`feat/page-projet`), jamais de push direct sur `main`.
2. Une pull request = une petite fonctionnalité, relue par au moins une autre personne.
3. `npm run typecheck` doit passer avant d'ouvrir une PR (on l'automatisera à l'étape 5).
