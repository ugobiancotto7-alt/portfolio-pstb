/**
 * Animations déclenchées par le défilement.
 *   data-reveal         l'élément apparaît en glissant quand il entre à l'écran
 *                       (style="--i: 2" pour le décaler : effet de cascade)
 *   data-count="12"     le nombre défile de 00 à 12 quand il devient visible
 *
 * IntersectionObserver est l'outil du navigateur qui prévient quand un
 * élément entre dans l'écran : bien plus économe qu'écouter chaque "scroll".
 */
import { once, reducedMotion } from "./util";

let revealObserver: IntersectionObserver | null = null;

export function mountReveal(el: HTMLElement) {
  if (!once(el, "reveal")) return;
  if (reducedMotion() || !("IntersectionObserver" in window)) return;
  // La classe sur <html> active le style "caché" : sans JavaScript, tout reste visible
  document.documentElement.classList.add("reveal-ready");
  revealObserver ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        (entry.target as HTMLElement).dataset.shown = "true";
        revealObserver?.unobserve(entry.target);
      }
    },
    { rootMargin: "0px 0px -8% 0px" },
  );
  revealObserver.observe(el);
}

/*
 * Le vrai chiffre est déjà dans le HTML (utile sans JavaScript et pour
 * Google). requestAnimationFrame fait défiler les nombres en 1,2 s avec un
 * ralenti en fin de course (easeOutCubic : 1 - (1 - t)³).
 */
export function mountCountUp(el: HTMLElement) {
  if (!once(el, "counted")) return;
  const target = Number(el.dataset.count) || 0;
  if (reducedMotion() || !("IntersectionObserver" in window)) return;
  const fmt = (n: number) => String(n).padStart(2, "0");
  let running = false;
  const run = () => {
    if (running) return;
    running = true;
    const t0 = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / 1200);
      el.textContent = fmt(Math.round(target * (1 - (1 - t) ** 3)));
      if (t < 1) requestAnimationFrame(step);
      else running = false;
    };
    requestAnimationFrame(step);
  };
  const io = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) {
      io.disconnect();
      run();
    }
  });
  io.observe(el);
  // On rejoue l'animation au survol de la carte, pour le plaisir
  el.closest("a, li")?.addEventListener("pointerenter", run);
}
