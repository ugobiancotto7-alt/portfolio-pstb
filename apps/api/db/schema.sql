-- =====================================================================
-- Schéma de la base de données du portfolio PSTB (PostgreSQL 15+)
-- ---------------------------------------------------------------------
-- Ce fichier crée toutes les tables. On peut le lancer :
--   * en local :      psql "$DATABASE_URL" -f db/schema.sql
--   * sur Supabase :  copier-coller dans "SQL Editor" puis "Run"
--
-- Conventions :
--   * chaque table a une clé primaire "id" en UUID (pratique pour l'app
--     mobile : on peut créer des id côté client si besoin) ;
--   * chaque contenu public a un "slug" (ex. "datadog-summit-paris-2026")
--     qui sert dans les URL à la place de l'id ;
--   * les noms de colonnes sont en snake_case (convention SQL), l'API
--     les renvoie en camelCase (convention JavaScript).
-- =====================================================================

-- Repartir de zéro (ATTENTION : supprime toutes les données).
drop view if exists timeline cascade;
drop table if exists learning_logs, milestones, photos, article_authors, articles,
  project_skills, project_members, projects, event_participants, events,
  member_skills, skills, members cascade;
drop type if exists article_type, publish_status, skill_category, timeline_kind cascade;

-- Extensions utiles
create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- Types énumérés : la base refuse toute valeur hors de cette liste.
create type article_type   as enum ('event_report', 'project', 'course', 'other');
create type publish_status as enum ('draft', 'published');
create type skill_category as enum ('language', 'data', 'ai', 'tool', 'soft');

-- ---------------------------------------------------------------------
-- MEMBRES : Ugo, Tim, Marcelo
-- ---------------------------------------------------------------------
create table members (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  first_name   text not null,
  last_name    text,
  role         text,               -- ex. "Responsable back-end"
  bio          text,
  avatar_url   text,               -- null = on affiche les initiales
  linkedin_url text,
  github_url   text,
  email        text unique,        -- sert à reconnaître l'admin à la connexion
  is_admin     boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- COMPÉTENCES (Python, SQL, Machine Learning, Git…)
-- et table de liaison membre <-> compétence (relation N-N)
-- ---------------------------------------------------------------------
create table skills (
  id       uuid primary key default gen_random_uuid(),
  slug     text not null unique,
  name     text not null,
  category skill_category not null
);

create table member_skills (
  member_id   uuid not null references members(id) on delete cascade,
  skill_id    uuid not null references skills(id) on delete cascade,
  level       smallint not null check (level between 1 and 5),
  acquired_on date,                -- permet de dessiner la progression dans le temps
  primary key (member_id, skill_id)
);

-- ---------------------------------------------------------------------
-- ÉVÉNEMENTS (salons, conférences, hackathons…)
-- ---------------------------------------------------------------------
create table events (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  title       text not null,
  description text,
  starts_on   date not null,
  ends_on     date,
  location    text,
  url         text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table event_participants (
  event_id  uuid not null references events(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  primary key (event_id, member_id)
);

-- ---------------------------------------------------------------------
-- PROJETS Data & IA
-- ---------------------------------------------------------------------
create table projects (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  title       text not null,
  summary     text not null,       -- 1-2 phrases pour les cartes
  description text,                -- Markdown
  results     text,                -- Markdown : métriques, conclusions
  github_url  text,
  demo_url    text,
  cover_url   text,
  status      publish_status not null default 'draft',
  started_on  date,
  ended_on    date,
  hours_spent integer check (hours_spent >= 0),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table project_members (
  project_id uuid not null references projects(id) on delete cascade,
  member_id  uuid not null references members(id) on delete cascade,
  primary key (project_id, member_id)
);

-- Les "technologies" d'un projet sont des compétences : on réutilise skills.
create table project_skills (
  project_id uuid not null references projects(id) on delete cascade,
  skill_id   uuid not null references skills(id) on delete cascade,
  primary key (project_id, skill_id)
);

-- ---------------------------------------------------------------------
-- ARTICLES / comptes rendus
-- ---------------------------------------------------------------------
create table articles (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  title        text not null,
  excerpt      text not null,      -- résumé pour les cartes et le SEO
  content      text not null,      -- Markdown
  cover_url    text,
  type         article_type not null default 'other',
  status       publish_status not null default 'draft',
  published_at timestamptz,
  event_id     uuid references events(id) on delete set null,
  project_id   uuid references projects(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  -- Colonne calculée automatiquement pour la recherche plein texte en
  -- français. Le titre pèse plus lourd (A) que le résumé (B) et le corps (C).
  search tsvector generated always as (
    setweight(to_tsvector('french', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('french', coalesce(excerpt, '')), 'B') ||
    setweight(to_tsvector('french', coalesce(content, '')), 'C')
  ) stored
);
create index articles_search_idx on articles using gin (search);
create index articles_published_idx on articles (status, published_at desc);

create table article_authors (
  article_id uuid not null references articles(id) on delete cascade,
  member_id  uuid not null references members(id) on delete cascade,
  primary key (article_id, member_id)
);

-- ---------------------------------------------------------------------
-- PHOTOS (galeries)
-- Une photo appartient à UN article, OU un projet, OU un événement.
-- url = null => c'est un emplacement vide ("placeholder") que l'admin
-- remplira plus tard en envoyant l'image.
-- ---------------------------------------------------------------------
create table photos (
  id           uuid primary key default gen_random_uuid(),
  url          text,
  storage_path text,               -- chemin dans Supabase Storage (pour supprimer)
  alt          text not null default '',
  caption      text,
  position     integer not null default 0,
  article_id   uuid references articles(id) on delete cascade,
  project_id   uuid references projects(id) on delete cascade,
  event_id     uuid references events(id) on delete cascade,
  created_at   timestamptz not null default now(),
  constraint photos_single_owner check (
    num_nonnulls(article_id, project_id, event_id) = 1
  )
);
create index photos_article_idx on photos (article_id, position);

-- ---------------------------------------------------------------------
-- JALONS manuels de la timeline (rentrée, examens, premier stage…)
-- ---------------------------------------------------------------------
create table milestones (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  happened_on date not null,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- JOURNAL D'APPRENTISSAGE : heures passées, pour le tableau de bord
-- ---------------------------------------------------------------------
create table learning_logs (
  id        uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete cascade,
  logged_on date not null,
  hours     numeric(4, 1) not null check (hours > 0 and hours <= 24),
  topic     text not null
);

-- ---------------------------------------------------------------------
-- VUE "timeline" : on n'écrit pas la timeline à la main, on la calcule
-- en réunissant (UNION ALL) les événements, les articles publiés, les
-- projets publiés et les jalons. Ajouter un article l'ajoute donc
-- automatiquement à la timeline.
-- ---------------------------------------------------------------------
-- security_invoker : la vue respecte les droits de celui qui l'interroge
-- (sinon, sur Supabase, elle contournerait la sécurité RLS plus bas).
create view timeline with (security_invoker = true) as
  select 'event'::text as kind, e.id, e.slug, e.title, e.description as summary, e.starts_on as date
  from events e
  union all
  select 'article', a.id, a.slug, a.title, a.excerpt, a.published_at::date
  from articles a where a.status = 'published'
  union all
  select 'project', p.id, p.slug, p.title, p.summary, coalesce(p.started_on, p.created_at::date)
  from projects p where p.status = 'published'
  union all
  select 'milestone', m.id, null, m.title, m.description, m.happened_on
  from milestones m;

-- ---------------------------------------------------------------------
-- Mise à jour automatique de updated_at à chaque UPDATE
-- ---------------------------------------------------------------------
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger members_updated_at  before update on members  for each row execute function set_updated_at();
create trigger events_updated_at   before update on events   for each row execute function set_updated_at();
create trigger projects_updated_at before update on projects for each row execute function set_updated_at();
create trigger articles_updated_at before update on articles for each row execute function set_updated_at();

-- ---------------------------------------------------------------------
-- SÉCURITÉ (Supabase) : Supabase expose automatiquement les tables du
-- schéma "public" via sa propre API. On active la Row Level Security
-- SANS aucune règle : personne ne peut lire/écrire par ce chemin-là.
-- Notre API Express se connecte avec le rôle propriétaire des tables,
-- qui n'est pas concerné par RLS. Tout passe donc par NOTRE API.
-- ---------------------------------------------------------------------
alter table members            enable row level security;
alter table skills             enable row level security;
alter table member_skills      enable row level security;
alter table events             enable row level security;
alter table event_participants enable row level security;
alter table projects           enable row level security;
alter table project_members    enable row level security;
alter table project_skills     enable row level security;
alter table articles           enable row level security;
alter table article_authors    enable row level security;
alter table photos             enable row level security;
alter table milestones         enable row level security;
alter table learning_logs      enable row level security;
