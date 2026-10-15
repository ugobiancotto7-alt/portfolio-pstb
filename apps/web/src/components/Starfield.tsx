/**
 * Fond étoilé animé (voir lib/effects/starfield.ts). Il se place en fond de
 * son parent, qui doit être en position relative. `soft` : version discrète.
 */
export function Starfield({ soft = false, className = "" }: { soft?: boolean; className?: string }) {
  return (
    <canvas
      data-starfield={soft ? "soft" : ""}
      aria-hidden
      className={`pointer-events-none absolute inset-0 size-full ${className}`}
    />
  );
}
