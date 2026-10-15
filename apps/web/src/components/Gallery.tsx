import type { CSSProperties } from "react";
import Image from "next/image";
import { ImageIcon } from "lucide-react";
import type { Photo } from "@pstb/shared";
import { Halo } from "./Halo";

/**
 * Galerie photos. Une photo sans url est un EMPLACEMENT VIDE : on affiche
 * un cadre en pointillés. Dès qu'une image est envoyée depuis l'admin,
 * l'url est remplie et la vraie photo apparaît à la même place.
 * Un clic sur une photo l'ouvre en plein écran (data-lightbox, lib/effects/lightbox.ts).
 * Au survol, un halo de lumière s'allume derrière la photo (components/Halo.tsx).
 */
export function Gallery({ photos }: { photos: Photo[] }) {
  if (photos.length === 0) return null;
  return (
    <section aria-labelledby="galerie" id="galerie" className="mt-20 scroll-mt-28">
      <p className="eyebrow">Galerie</p>
      <h2 className="mt-3 mb-8 font-display text-4xl sm:text-5xl">La journée en images</h2>
      <ul data-lightbox className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
        {photos.map((photo, i) => (
          <li key={photo.id} data-reveal style={{ "--i": i % 4 } as CSSProperties}>
            <div className="halo">
              {photo.url && <Halo src={photo.url} />}
              <div
                data-full={photo.url ?? undefined}
                data-caption={photo.caption ?? photo.alt}
                className={`group relative aspect-[3/4] overflow-hidden rounded-xl border border-border bg-sunken ${
                  photo.url ? "cursor-zoom-in transition hover:border-brand-500" : ""
                }`}
              >
                {photo.url ? (
                  <Image
                    src={photo.url}
                    alt={photo.alt}
                    fill
                    sizes="(min-width: 1024px) 25vw, 50vw"
                    className="object-cover transition duration-700 group-hover:scale-110"
                  />
                ) : null}
                {photo.url ? (
                  <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-black/50 px-2 py-1 font-mono text-[10px] text-white opacity-0 backdrop-blur transition group-hover:opacity-100">
                    agrandir ⤢
                  </span>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-2 border border-dashed border-border text-muted">
                    <ImageIcon className="size-6" aria-hidden />
                    <span className="text-xs">Photo à venir</span>
                  </div>
                )}
              </div>
            </div>
            {photo.caption && (
              <p className="mt-3 text-sm leading-5 text-muted">
                <span className="mr-2 font-mono text-xs text-cyan">{String(i + 1).padStart(2, "0")}</span>
                {photo.caption}
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
