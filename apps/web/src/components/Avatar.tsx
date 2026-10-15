import Image from "next/image";
import type { MemberSummary } from "@pstb/shared";

/** Photo du membre, ou ses initiales sur un dégradé si pas encore de photo. */
export function Avatar({ member, size = 48 }: { member: MemberSummary; size?: number }) {
  const initials = `${member.firstName[0] ?? ""}${member.lastName?.[0] ?? ""}`.toUpperCase();
  if (member.avatarUrl) {
    return (
      <Image
        src={member.avatarUrl}
        alt={member.firstName}
        width={size}
        height={size}
        className="rounded-full object-cover"
        // Les photos sont des portraits en pied : on cadre sur le visage
        style={{ width: size, height: size, objectPosition: "50% 20%" }}
      />
    );
  }
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-accent-500 font-semibold text-white"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      aria-hidden
    >
      {initials}
    </span>
  );
}
