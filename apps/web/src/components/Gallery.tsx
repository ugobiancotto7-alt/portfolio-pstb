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
    <section aria-labelledby="galerie" className="mt-12">
      <h2 id="galerie" className="mb-4 text-2xl font-bold tracking-tight">
        Galerie
      </h2>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {photos.map((photo) => (
          <li key={photo.id} className="relative aspect-[3/4] overflow-hidden rounded-xl">
            {photo.url ? (
              <figure className="h-full">
                <Image
                  src={photo.url}
                  alt={photo.alt}
                  fill
                  sizes="(min-width: 640px) 33vw, 50vw"
                  className="object-cover transition hover:scale-105"
                />
                {photo.caption && (
                  <figcaption className="absolute inset-x-0 bottom-0 bg-black/50 p-2 text-xs text-white">
                    {photo.caption}
                  </figcaption>
                )}
              </figure>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border text-muted">
                <ImageIcon className="size-6" aria-hidden />
                <span className="text-xs">Photo à venir</span>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
