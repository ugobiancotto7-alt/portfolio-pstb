/**
 * Page d'accueil, mise en page "éditoriale" :
 *   1. grande photo plein écran avec le titre par-dessus
 *   2. les chiffres clés en grand
 *   3. l'équipe en photos
 *   4. le dernier compte rendu (photo + texte côte à côte)
 *   5. quelques moments en images
 *   6. un bandeau final pour inviter à suivre la timeline
 *
 * C'est un Server Component : il est "async" et appelle l'API avant
 * d'envoyer le HTML au navigateur.
 */
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/Container";
import { SectionHeading } from "@/components/SectionHeading";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";

const pad = (n: number) => String(n).padStart(2, "0");

export default async function HomePage() {
  const [members, articles, stats] = await Promise.all([api.members(), api.articles(), api.stats()]);
  const latest = articles.items[0];
  // Le dernier article complet, pour récupérer ses photos
  const latestFull = latest ? await api.article(latest.slug) : null;
  const photos = latestFull?.photos.filter((p) => p.url) ?? [];
  const heroPhoto = photos[0];
  const moments = photos.slice(2, 5); // 3 photos différentes de la couverture et du hero

  const figures = [
    { value: pad(members.length), label: "étudiants, une même promo" },
    { value: pad(stats.totals.events), label: stats.totals.events > 1 ? "événements suivis ensemble" : "événement suivi ensemble" },
    { value: pad(stats.totals.articles), label: stats.totals.articles > 1 ? "comptes rendus publiés" : "compte rendu publié" },
    { value: "12", label: "mois de progression à raconter" },
  ];

  return (
    <>
      {/* 1. HERO : la photo remplit toute la largeur, le texte est posé dessus */}
      <section className="relative isolate flex min-h-[560px] items-end overflow-hidden bg-ink sm:min-h-[640px]">
        {heroPhoto?.url && (
          <Image src={heroPhoto.url} alt={heroPhoto.alt} fill priority sizes="100vw" className="-z-10 object-cover opacity-80" />
        )}
        {/* Dégradé sombre pour que le texte blanc reste lisible sur la photo */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/85 via-black/40 to-black/10" aria-hidden />
        <Container className="pb-12 pt-32 text-white sm:pb-16">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
            Bachelor Data &amp; IA · Paris School of Technology &amp; Business
          </p>
          <h1 className="mt-5 max-w-4xl font-display text-5xl leading-[0.98] sm:text-7xl lg:text-[5.5rem]">
            Notre année en data et en IA,
            <br />
            <em className="text-white/85">racontée mois par mois.</em>
          </h1>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link
              href="/timeline"
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-white/85"
            >
              Voir la timeline <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/equipe"
              className="inline-flex items-center rounded-full border border-white/50 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Rencontrer l&apos;équipe
            </Link>
          </div>
          {heroPhoto && (
            <p className="mt-12 text-xs text-white/60">
              {heroPhoto.caption} · {formatDate(latestFull?.event?.startsOn)}
            </p>
          )}
        </Container>
      </section>

      {/* Bandeau de thèmes, comme des "pastilles" */}
      <div className="border-b border-border">
        <Container className="flex flex-wrap gap-x-8 gap-y-2 py-5 text-sm text-muted">
          {["Projets Data & IA", "Comptes rendus d'événements", "Compétences acquises", "Progression mensuelle"].map((t) => (
            <span key={t} className="inline-flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-brand-500" aria-hidden />
              {t}
            </span>
          ))}
        </Container>
      </div>

      {/* 2. CHIFFRES CLÉS */}
      <Container className="mt-24">
        <SectionHeading n="01" label="En chiffres" title="Une année, trois parcours.">
          Ces chiffres sont calculés en direct par notre API à partir de la base de données.
        </SectionHeading>
        <dl className="grid grid-cols-2 border-t border-border lg:grid-cols-4">
          {figures.map((f) => (
            <div key={f.label} className="border-b border-border py-8 pr-6 lg:border-b-0">
              <dt className="sr-only">{f.label}</dt>
              <dd className="font-display text-6xl leading-none tabular-nums sm:text-7xl">{f.value}</dd>
              <dd className="mt-3 text-sm text-muted">{f.label}</dd>
            </div>
          ))}
        </dl>
      </Container>

      {/* 3. L'ÉQUIPE */}
      <Container className="mt-28">
        <SectionHeading n="02" label="L'équipe" title="Ugo, Tim et Marcelo.">
          Trois étudiants de la même promo, qui documentent ensemble ce qu&apos;ils apprennent.
        </SectionHeading>
        <div className="grid gap-6 sm:grid-cols-3">
          {members.map((m, i) => (
            <Link key={m.id} href={`/equipe#${m.slug}`} className="group">
              <div className="relative aspect-[4/5] overflow-hidden bg-sunken">
                {m.avatarUrl && (
                  <Image
                    src={m.avatarUrl}
                    alt={m.firstName}
                    fill
                    sizes="(min-width: 640px) 33vw, 100vw"
                    className="object-cover transition duration-500 group-hover:scale-[1.03]"
                  />
                )}
              </div>
              <div className="mt-4 flex items-baseline justify-between border-b border-border pb-4">
                <h3 className="font-display text-3xl">{m.firstName}</h3>
                <span className="text-xs text-muted">{pad(i + 1)}</span>
              </div>
              <p className="mt-2 text-sm text-muted">{m.role}</p>
            </Link>
          ))}
        </div>
      </Container>

      {/* 4. DERNIER COMPTE RENDU : photo et texte côte à côte */}
      {latest && (
        <Container className="mt-28">
          <SectionHeading n="03" label="Dernier article" title="Sur le terrain." />
          <Link href={`/articles/${latest.slug}`} className="group grid items-center gap-8 md:grid-cols-2 md:gap-14">
            <div className="relative aspect-[4/3] overflow-hidden bg-sunken">
              {latest.coverUrl && (
                <Image
                  src={latest.coverUrl}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover transition duration-500 group-hover:scale-[1.03]"
                />
              )}
            </div>
            <div>
              <p className="eyebrow">{formatDate(latest.publishedAt)}</p>
              <h3 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">{latest.title}</h3>
              <p className="mt-5 leading-7 text-muted">{latest.excerpt}</p>
              <span className="mt-8 inline-flex items-center gap-2 border-b border-fg pb-1 text-sm font-semibold">
                Lire le compte rendu <ArrowRight className="size-4 transition group-hover:translate-x-1" />
              </span>
            </div>
          </Link>
        </Container>
      )}

      {/* 5. MOMENTS EN IMAGES */}
      {moments.length > 0 && latest && (
        <Container className="mt-28">
          <SectionHeading n="04" label="En images" title="Quelques moments.">
            Les photos de nos événements, ajoutées par l&apos;équipe.
          </SectionHeading>
          <ul className="grid gap-4 sm:grid-cols-3">
            {moments.map((p, i) => (
              <li key={p.id}>
                <Link href={`/articles/${latest.slug}#galerie`} className="group block">
                  <div className="relative aspect-[3/4] overflow-hidden bg-sunken">
                    <Image
                      src={p.url!}
                      alt={p.alt}
                      fill
                      sizes="(min-width: 640px) 33vw, 100vw"
                      className="object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                  <p className="mt-3 text-sm text-muted">
                    <span className="mr-2 font-display italic text-fg">{pad(i + 1)}</span>
                    {p.caption}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      )}

      {/* 6. BANDEAU FINAL */}
      <Container className="mt-28">
        <div className="bg-ink px-6 py-16 text-on-ink sm:px-14 sm:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-60">La suite</p>
          <h2 className="mt-4 max-w-2xl font-display text-5xl leading-[1.02] sm:text-6xl">
            Suivez notre progression, mois après mois.
          </h2>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/timeline" className="rounded-full bg-on-ink px-6 py-3 text-sm font-semibold text-ink transition hover:opacity-85">
              Ouvrir la timeline
            </Link>
            <Link href="/projets" className="rounded-full border border-current px-6 py-3 text-sm font-semibold transition hover:opacity-80">
              Voir les projets
            </Link>
          </div>
        </div>
      </Container>
    </>
  );
}
