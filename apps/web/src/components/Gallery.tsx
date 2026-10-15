import Image from "next/image";
import { ImageIcon } from "lucide-react";
import type { Photo } from "@pstb/shared";

/**
 * Galerie photos. Une photo sans url est un EMPLACEMENT VIDE : on affiche
 * un cadre en pointillés. Dès qu'une image est envoyée depuis l'admin,
 * l'url est remplie et la vraie photo apparaît à la même place.
 */
export function Gallery({ photos }: { photos: Photo[] }) {
  if (photos.length === 0) return null;
  return (
    <section aria-labelledby="galerie" id="galerie" className="mt-20 scroll-mt-28">
      <p className="eyebrow">Galerie</p>
      <h2 className="mt-3 mb-8 font-display text-4xl sm:text-5xl">La journée en images</h2>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
        {photos.map((photo, i) => (
          <li key={photo.id}>
            <div className="relative aspect-[3/4] overflow-hidden bg-sunken">
              {photo.url ? (
                <Image src={photo.url} alt={photo.alt} fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover" />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 border border-dashed border-border text-muted">
                  <ImageIcon className="size-6" aria-hidden />
                  <span className="text-xs">Photo à venir</span>
                </div>
              )}
            </div>
            {photo.caption && (
              <p className="mt-3 text-sm leading-5 text-muted">
                <span className="mr-2 font-display italic text-fg">{String(i + 1).padStart(2, "0")}</span>
                {photo.caption}
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
