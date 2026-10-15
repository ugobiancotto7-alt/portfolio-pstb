/**
 * Carrousel 3D façon "coverflow" : <div data-carousel> contenant
 * une liste qui défile horizontalement ([data-carousel-track]) et deux boutons
 * [data-carousel-prev] / [data-carousel-next].
 *
 * Le défilement lui-même est natif (scroll-snap en CSS : au doigt, à la
 * molette, au clavier). Le JavaScript ajoute trois choses :
 *   1. à la souris, on peut attraper la bande et la faire glisser ;
 *   2. chaque photo reçoit --c, sa distance au centre (-1 à gauche, +1 à
 *      droite) : le CSS la fait pivoter et reculer, celle du milieu est face à nous ;
 *   3. les flèches avancent d'une photo.
 */
import { clamp, once, reducedMotion, throttleFrame } from "./util";

export function mountCarousel(root: HTMLElement) {
  if (!once(root, "carousel")) return;
  const track = root.querySelector<HTMLElement>("[data-carousel-track]");
  if (!track) return;
  const items = [...track.children] as HTMLElement[];

  const update = throttleFrame(() => {
    const r = track.getBoundingClientRect();
    const center = r.left + r.width / 2;
    for (const item of items) {
      const ir = item.getBoundingClientRect();
      const c = clamp((ir.left + ir.width / 2 - center) / (r.width / 2), -1.5, 1.5);
      item.style.setProperty("--c", c.toFixed(3));
      item.style.setProperty("--ac", Math.abs(c).toFixed(3));
    }
  });
  if (!reducedMotion()) {
    track.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    new ResizeObserver(update).observe(track);
    update();
  }

  // Flèches : avancer ou reculer de la largeur d'une photo
  const step = (dir: number) => {
    const w = items[0]?.getBoundingClientRect().width ?? 300;
    track.scrollBy({ left: dir * (w + 16), behavior: reducedMotion() ? "auto" : "smooth" });
  };
  root.querySelector("[data-carousel-prev]")?.addEventListener("click", () => step(-1));
  root.querySelector("[data-carousel-next]")?.addEventListener("click", () => step(1));

  // Glisser à la souris (au doigt, le navigateur le fait déjà tout seul)
  let drag: { x: number; left: number; moved: boolean } | null = null;
  let swallowClickUntil = 0;
  track.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    e.preventDefault(); // évite de "prendre" l'image comme pour la glisser-déposer
    drag = { x: e.clientX, left: track.scrollLeft, moved: false };
    track.style.scrollSnapType = "none"; // sinon l'aimantation se bat avec la souris
    track.style.cursor = "grabbing";
  });
  window.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    if (Math.abs(dx) > 5) drag.moved = true;
    track.scrollLeft = drag.left - dx;
  });
  window.addEventListener("pointerup", () => {
    if (!drag) return;
    if (drag.moved) swallowClickUntil = performance.now() + 80;
    drag = null;
    track.style.cursor = "";
    track.style.scrollSnapType = ""; // l'aimantation reprend : la photo la plus proche se centre
  });
  track.addEventListener("dragstart", (e) => e.preventDefault()); // pas de glisser-déposer d'image
  // Un glisser ne doit pas ouvrir la photo : on avale le clic qui le termine
  track.addEventListener(
    "click",
    (e) => {
      if (performance.now() < swallowClickUntil) {
        e.stopPropagation();
        e.preventDefault();
      }
    },
    { capture: true },
  );
}
