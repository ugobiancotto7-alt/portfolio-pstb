import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Image from "next/image";
import { SKILL_CATEGORIES } from "@pstb/shared";
import { Avatar } from "@/components/Avatar";
import { Container } from "@/components/Container";
import { ExternalLinks } from "@/components/ExternalLinks";
import { PageHeader } from "@/components/PageHeader";
import { api } from "@/lib/api";

export const metadata: Metadata = { title: "Équipe" };

export default async function TeamPage() {
  const members = await api.members();
  return (
    <Container>
      <PageHeader n="01" label="L'équipe" title="L'équipe">
        Trois étudiants, trois profils, un même objectif : progresser ensemble.
      </PageHeader>

      <div className="mt-14 grid gap-x-6 gap-y-14 md:grid-cols-3">
        {members.map((member, i) => (
          <article
            key={member.id}
            id={member.slug}
            data-reveal
            style={{ "--i": i } as CSSProperties}
            className="glass flex scroll-mt-28 flex-col overflow-hidden rounded-2xl"
          >
            <div data-tilt="6" className="relative aspect-[4/5] overflow-hidden bg-sunken">
              {member.avatarUrl ? (
                <Image
                  src={member.avatarUrl}
                  alt={member.firstName}
                  fill
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Avatar member={member} size={96} />
                </div>
              )}
            </div>
            <div className="flex flex-1 flex-col p-6">
              <div className="flex items-baseline justify-between border-b border-border pb-4">
                <h2 className="font-display text-3xl">
                  {member.firstName} {member.lastName}
                </h2>
                <span className="font-mono text-xs text-cyan">{String(i + 1).padStart(2, "0")}</span>
              </div>
              {member.role && <p className="mt-3 text-sm font-semibold">{member.role}</p>}
              {member.bio && <p className="mt-2 text-sm leading-6 text-muted">{member.bio}</p>}

              {member.skills.length > 0 && (
                <ul className="mt-4 flex flex-wrap gap-1.5">
                  {/* On trie les compétences par catégorie pour un affichage stable */}
                  {[...member.skills]
                    .sort((a, b) => SKILL_CATEGORIES.indexOf(a.category) - SKILL_CATEGORIES.indexOf(b.category))
                    .map((skill) => (
                      <li
                        key={skill.id}
                        className="rounded-full border border-border px-3 py-1 text-xs"
                        title={`Niveau ${skill.level}/5`}
                      >
                        {skill.name}
                      </li>
                    ))}
                </ul>
              )}

              <div className="mt-auto pt-5">
                <ExternalLinks member={member} />
              </div>
            </div>
          </article>
        ))}
      </div>
    </Container>
  );
}
