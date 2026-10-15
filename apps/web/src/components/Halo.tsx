import Image from "next/image";

/**
 * Halo de lumière qui s'allume derrière une photo quand la souris passe dessus.
 *
 * L'astuce : on glisse DERRIÈRE la photo une deuxième copie de la même image,
 * très floue et plus saturée. Au repos elle est invisible ; au survol du parent
 * (qui porte la classe "halo", voir globals.css), elle apparaît et déborde du cadre.
 * On dirait que la photo diffuse sa propre lumière, avec ses propres couleurs.
 *
 * La copie est demandée toute petite (sizes="96px") : une fois floutée, on ne voit
 * aucune différence, et elle ne pèse presque rien à télécharger.
 *
 * Utilisation :
 *   <div className="halo">
 *     <Halo src={photo.url} />
 *     <div className="overflow-hidden rounded-2xl">…la vraie photo…</div>
 *   </div>
 * Le parent ne doit avoir ni fond ni overflow-hidden, sinon le halo serait caché.
 */
export function Halo({ src }: { src: string }) {
  return <Image src={src} alt="" aria-hidden fill sizes="96px" draggable={false} className="halo-light" />;
}
