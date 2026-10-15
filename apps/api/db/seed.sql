-- =====================================================================
-- Données de départ (seed) : l'équipe, quelques compétences, le premier
-- événement et son compte rendu avec une galerie d'emplacements vides.
-- À lancer APRÈS schema.sql :  psql "$DATABASE_URL" -f db/seed.sql
--
-- Astuce : on utilise des CTE ("with ... as") et des sous-requêtes sur
-- les slugs pour relier les lignes entre elles sans connaître les UUID.
-- =====================================================================

-- ----- Membres (à compléter : nom, rôle, bio, liens, e-mail de connexion)
insert into members (slug, first_name, role, bio, linkedin_url, github_url, email) values
  ('ugo',     'Ugo',     'Étudiant Bachelor Data & IA', 'Bio à compléter depuis l''espace admin.', null, 'https://github.com/ugobiancotto7-alt', null),
  ('tim',     'Tim',     'Étudiant Bachelor Data & IA', 'Bio à compléter depuis l''espace admin.', null, null, null),
  ('marcelo', 'Marcelo', 'Étudiant Bachelor Data & IA', 'Bio à compléter depuis l''espace admin.', null, null, null);

-- ----- Compétences de base de la filière
insert into skills (slug, name, category) values
  ('python',           'Python',            'language'),
  ('sql',              'SQL',               'language'),
  ('typescript',       'TypeScript',        'language'),
  ('pandas',           'pandas',            'data'),
  ('data-viz',         'Data visualisation','data'),
  ('machine-learning', 'Machine Learning',  'ai'),
  ('observability',    'Observabilité',     'tool'),
  ('git',              'Git & GitHub',      'tool'),
  ('teamwork',         'Travail en équipe', 'soft');

-- ----- Premier événement
insert into events (slug, title, description, starts_on, location, url) values
  ('datadog-summit-paris-2026',
   'Datadog Summit Paris',
   'Journée de conférences et de workshops sur l''observabilité, la sécurité et l''IA en production.',
   '2026-10-15',
   'Paris 5e',
   null);

insert into event_participants (event_id, member_id)
select e.id, m.id
from events e cross join members m
where e.slug = 'datadog-summit-paris-2026';

-- ----- Premier article : compte rendu de l'événement
insert into articles (slug, title, excerpt, type, status, published_at, event_id, content)
select
  'compte-rendu-datadog-summit-paris-2026',
  'Compte rendu : Datadog Summit Paris 2026',
  'Notre première conférence de l''année : observabilité, IA en production et résolution d''incidents, racontées par des équipes qui le font au quotidien.',
  'event_report',
  'published',
  '2026-10-15 18:00:00+02',
  e.id,
  $md$
Le 15 octobre 2026, nous sommes allés tous les trois (Ugo, Tim et Marcelo) au **Datadog Summit** à Paris (5e). Une journée entière consacrée à l'observabilité, c'est-à-dire l'art de comprendre ce qui se passe *à l'intérieur* d'un système informatique à partir des données qu'il produit : métriques, logs et traces.

## Ce qu'on a vu

### Observabilité et sécurité sur toute la « stack IA »
La keynote a présenté une idée simple : une application d'IA ne se résume pas au modèle. Il faut surveiller **quatre couches** : les **agents**, les **modèles**, les **données** et l'**infrastructure** (jusqu'aux GPU). Plusieurs outils ont été annoncés autour de cette idée : GPU Monitoring, Data Observability, Agent Observability, et en preview des outils comme AI Guard ou Bits Evals pour évaluer et sécuriser les agents.

### Témoignage client : Modal
Akshat Bubna, co-fondateur et CTO de Modal, a expliqué comment son équipe résout **96 % des problèmes avant qu'ils n'affectent les clients**, pour garantir la fiabilité de workloads à grande échelle.

### Amex GBT : l'IA au service des incidents
Olivier Garbé, VP AI & Platforms chez American Express Global Business Travel, a présenté « Au-delà de l'alerte » : comment l'IA aide à accélérer la **résolution d'incidents**, au lieu de simplement déclencher des alertes.

### Les workshops de l'après-midi
De 14h30 à 17h30, trois ateliers pratiques étaient proposés :
- Les fondamentaux Datadog pour les développeurs ;
- Optimisation des performances frontend avec Datadog RUM (*Real User Monitoring*) ;
- Agent Observability : de la configuration aux insights.

## Ce qu'on a appris

- **Un modèle en production, c'est un système vivant.** Il faut mesurer en continu la qualité des données d'entrée, la latence, les coûts GPU et le comportement des agents, pas seulement la précision obtenue dans un notebook.
- **Les trois piliers de l'observabilité** : les *métriques* (des chiffres dans le temps), les *logs* (des événements texte) et les *traces* (le chemin d'une requête à travers les services).
- **Anticiper plutôt que réagir.** L'exemple de Modal montre qu'avec de bons indicateurs, on peut corriger un problème avant que l'utilisateur ne le voie.
- **L'IA peut aussi aider les équipes techniques** : regrouper les alertes, proposer une cause probable, résumer un incident.

## Ce qu'on retient pour la suite

1. **Instrumenter nos propres projets** : ajouter des logs structurés et quelques métriques simples à nos projets Data & IA, y compris à ce site.
2. **Penser « production » dès le début** : pour chaque modèle qu'on entraîne cette année, se demander comment on le surveillerait une fois déployé.
3. **Tester un outil d'observabilité** sur un mini-projet (la plupart proposent une offre gratuite ou étudiante).
4. **Continuer à aller à des événements** : on a appris autant en une journée qu'en plusieurs heures de lecture, et ça donne des idées de projets.

*Galerie : les photos de la journée arrivent bientôt.*
$md$
from events e
where e.slug = 'datadog-summit-paris-2026';

insert into article_authors (article_id, member_id)
select a.id, m.id
from articles a cross join members m
where a.slug = 'compte-rendu-datadog-summit-paris-2026';

-- ----- Galerie : 6 emplacements vides (url = null) à remplir via l'admin
insert into photos (article_id, alt, position)
select a.id, 'Photo à venir', g.n
from articles a cross join generate_series(1, 6) as g(n)
where a.slug = 'compte-rendu-datadog-summit-paris-2026';

-- ----- Un premier jalon pour la timeline
insert into milestones (title, description, happened_on) values
  ('Lancement du site portfolio', 'On commence à documenter notre année en Bachelor Data & IA.', '2026-10-15');
