import type { Metadata } from "next";
import { SKILL_CATEGORIES } from "@pstb/shared";
import { Avatar } from "@/components/Avatar";
import { ExternalLinks } from "@/components/ExternalLinks";
import { PageHeader } from "@/components/PageHeader";
import { api } from "@/lib/api";

export const metadata: Metadata = { title: "Équipe" };

export default async function TeamPage() {
  const members = await api.members();
  return (
    <>
      <PageHeader title="L'équipe">Trois étudiants, trois profils, un même objectif : progresser ensemble.</PageHeader>
      <div className="grid gap-6 md:grid-cols-3">
        {members.map((member) => (
          <article key={member.id} id={member.slug} className="flex flex-col rounded-2xl border border-border bg-surface p-6">
            <Avatar member={member} size={72} />
            <h2 className="mt-4 text-xl font-bold">
              {member.firstName} {member.lastName}
            </h2>
            {member.role && <p className="text-sm font-medium text-brand-600 dark:text-brand-400">{member.role}</p>}
            {member.bio && <p className="mt-3 text-sm text-muted">{member.bio}</p>}

            {member.skills.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-1.5">
                {/* On trie les compétences par catégorie pour un affichage stable */}
                {[...member.skills]
                  .sort((a, b) => SKILL_CATEGORIES.indexOf(a.category) - SKILL_CATEGORIES.indexOf(b.category))
                  .map((skill) => (
                    <li key={skill.id} className="rounded-full bg-brand-500/10 px-2.5 py-1 text-xs font-medium" title={`Niveau ${skill.level}/5`}>
                      {skill.name}
                    </li>
                  ))}
              </ul>
            )}

            <div className="mt-auto pt-5">
              <ExternalLinks member={member} />
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
