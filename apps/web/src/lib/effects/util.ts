/**
 * Petits outils partagés par tous les effets (lib/effects/*.ts).
 */

/** Le visiteur a demandé moins d'animations dans les réglages de son système. */
export const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Évite de brancher deux fois le même effet sur le même élément.
 * La marque est rangée dans un attribut à part (data-fx-tilt…) pour ne jamais
 * écraser la valeur de l'attribut de l'effet lui-même (data-tilt="8").
 */
export function once(el: HTMLElement, key: string) {
  const mark = `fx${key.charAt(0).toUpperCase()}${key.slice(1)}`;
  if (el.dataset[mark] === "1") return false;
  el.dataset[mark] = "1";
  return true;
}

export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** Lit une variable CSS (ex. "--accent") telle qu'elle s'applique à `el`, donc selon le thème. */
export function cssVar(el: Element, name: string, fallback: string) {
  return getComputedStyle(el).getPropertyValue(name).trim() || fallback;
}

/** "#8b8bff" -> "139 139 255", pour écrire ensuite `rgb(139 139 255 / 0.4)`. */
export function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h.slice(0, 6);
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return "139 139 255";
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

/**
 * Garde un <canvas> à la taille de son affichage, en tenant compte des
 * écrans haute densité (Retina : 2 pixels physiques par pixel CSS).
 * ResizeObserver prévient aussi quand un élément caché redevient visible.
 */
export function fitCanvas(canvas: HTMLCanvasElement, onResize?: () => void) {
  const size = { width: 0, height: 0, dpr: 1 };
  const resize = (notify = true) => {
    size.dpr = Math.min(window.devicePixelRatio || 1, 2);
    size.width = canvas.clientWidth;
    size.height = canvas.clientHeight;
    canvas.width = Math.max(1, Math.round(size.width * size.dpr));
    canvas.height = Math.max(1, Math.round(size.height * size.dpr));
    if (notify) onResize?.();
  };
  resize(false); // première mesure : l'appelant n'est pas encore prêt à être prévenu
  new ResizeObserver(() => resize()).observe(canvas);
  return size;
}

/**
 * Boucle d'animation économe : elle ne tourne que lorsque l'élément est
 * visible à l'écran ET que l'onglet est affiché. Hors écran, zéro calcul,
 * ce qui préserve la batterie sur mobile.
 * Avec "moins d'animations", on dessine une seule image ; `kick()` permet
 * de redessiner à la demande (après un mouvement de souris par exemple).
 */
export function animate(el: Element, frame: (now: number) => void) {
  let visible = true;
  let raf = 0;
  const loop = (now: number) => {
    raf = 0;
    if (!el.isConnected) return stop(); // la page a changé : on arrête tout
    frame(now);
    if (!reducedMotion()) kick();
  };
  const kick = () => {
    if (!raf && visible && !document.hidden) raf = requestAnimationFrame(loop);
  };
  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    kick();
  });
  io.observe(el);
  document.addEventListener("visibilitychange", kick);
  const stop = () => {
    io.disconnect();
    document.removeEventListener("visibilitychange", kick);
    if (raf) cancelAnimationFrame(raf);
  };
  kick();
  return { kick, stop };
}

/** Exécute `fn` au plus une fois par image, même si l'évènement (scroll…) arrive 10 fois. */
export function throttleFrame(fn: () => void) {
  let queued = false;
  return () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      fn();
    });
  };
}
