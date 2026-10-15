import type { Member } from "@pstb/shared";

/** Liens LinkedIn / GitHub d'un membre (masqués s'ils ne sont pas renseignés). */
export function ExternalLinks({ member }: { member: Member }) {
  const links = [
    { href: member.linkedinUrl, label: "LinkedIn" },
    { href: member.githubUrl, label: "GitHub" },
  ].filter((l): l is { href: string; label: string } => Boolean(l.href));

  if (links.length === 0) return null;
  return (
    <div className="flex gap-2">
      {links.map((l) => (
        <a
          key={l.label}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted transition hover:border-brand-500 hover:text-fg"
        >
          {l.label} ↗
        </a>
      ))}
    </div>
  );
}
