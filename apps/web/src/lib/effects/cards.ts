/**
 * Effets de cartes au survol de la souris.
 *   data-tilt="8"     la carte s'incline en 3D (8 = angle maximum en degrés)
 *   data-spotlight    un halo lumineux suit la souris (voir .spotlight dans globals.css)
 */
import { once, reducedMotion } from "./util";

/*
 * Inclinaison : on mesure où est la souris dans la carte (de -0,5 à +0,5
 * sur chaque axe) et on en déduit deux angles, passés au CSS par les
 * variables --rx et --ry. C'est le CSS qui applique la rotation.
 */
export function mountTilt(el: HTMLElement) {
  if (!once(el, "tilt")) return;
  const max = Number(el.dataset.tilt) || 8;
  el.addEventListener("pointermove", (e) => {
    if (reducedMotion() || e.pointerType === "touch") return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--ry", `${px * max}deg`);
    el.style.setProperty("--rx", `${-py * max}deg`);
  });
  el.addEventListener("pointerleave", () => {
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--rx", "0deg");
  });
}

/*
 * Halo : on donne au CSS la position de la souris dans la carte (--mx, --my),
 * et un dégradé radial centré sur ce point crée l'effet "lampe torche".
 */
export function mountSpotlight(el: HTMLElement) {
  if (!once(el, "spot")) return;
  el.addEventListener("pointermove", (e) => {
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  });
}
