/**
 * Les interactions du site, en JavaScript "pur" (sans React).
 *
 * Pourquoi pas en React ? Ces effets ne changent pas les données, ils
 * animent du HTML déjà affiché. Écrits en pur JS et branchés sur des
 * attributs data-*, ils se réutilisent tels quels ailleurs (par exemple
 * dans l'aperçu statique du site). Le composant <Enhancer /> appelle
 * simplement enhance() après chaque changement de page.
 *
 * Un fichier par famille d'effets, dans lib/effects/ :
 *   planet.ts      data-neural           la planète neuronale 3D de l'accueil
 *   starfield.ts   data-starfield        le fond étoilé
 *   timeline.ts    data-orbit, data-timeline, data-month-nav   la page Timeline
 *   cards.ts       data-tilt, data-spotlight                   cartes au survol
 *   scroll.ts      data-reveal, data-count                     animations au défilement
 *   lightbox.ts    data-lightbox                               visionneuse photo plein écran
 *   navigation.ts  data-nav, data-menu, data-scroll-progress, data-scroll-to
 */
import { mountSpotlight, mountTilt } from "./effects/cards";
import { mountMenu, mountNavIndicator, mountScrollProgress, mountScrollTo } from "./effects/navigation";
import { mountLightbox } from "./effects/lightbox";
import { mountPlanet } from "./effects/planet";
import { mountCountUp, mountReveal } from "./effects/scroll";
import { mountStarfield } from "./effects/starfield";
import { mountMonthNav, mountOrbit, mountTimeline } from "./effects/timeline";

/** Chaque sélecteur CSS et l'effet à brancher sur les éléments trouvés. */
const effects: [string, (el: HTMLElement) => void][] = [
  ["canvas[data-starfield]", (el) => mountStarfield(el as HTMLCanvasElement)],
  ["canvas[data-neural]", (el) => mountPlanet(el as HTMLCanvasElement)],
  ["canvas[data-orbit]", (el) => mountOrbit(el as HTMLCanvasElement)],
  ["[data-timeline]", mountTimeline],
  ["[data-month-nav]", mountMonthNav],
  ["[data-tilt]", mountTilt],
  ["[data-spotlight]", mountSpotlight],
  ["[data-reveal]", mountReveal],
  ["[data-count]", mountCountUp],
  ["[data-lightbox]", mountLightbox],
  ["[data-nav]", mountNavIndicator],
  ["[data-menu]", mountMenu],
  ["[data-scroll-progress]", mountScrollProgress],
  ["a[data-scroll-to]", mountScrollTo],
];

/** Lance tous les effets présents dans `root`. Sans danger si appelé plusieurs fois. */
export function enhance(root: ParentNode = document) {
  for (const [selector, mount] of effects) root.querySelectorAll<HTMLElement>(selector).forEach(mount);
}
