/**
 * Tout ce qui aide à se déplacer dans le site.
 *   data-nav              barre de liens avec une "pilule" qui glisse sous la souris
 *   data-menu …           menu plein écran (data-menu-open / data-menu-close / data-menu-preview)
 *   data-scroll-progress  fine barre qui se remplit pendant la lecture de la page
 *   data-scroll-to        lien d'ancre (#id) avec défilement doux
 */
import { once, reducedMotion, throttleFrame } from "./util";

export function mountNavIndicator(nav: HTMLElement) {
  if (!once(nav, "nav")) return;
  const pill = nav.querySelector<HTMLElement>("[data-nav-pill]");
  if (!pill) return;
  const moveTo = (link: HTMLElement | null) => {
    if (!link) {
      pill.style.opacity = "0";
      return;
    }
    pill.style.opacity = "1";
    pill.style.width = `${link.offsetWidth}px`;
    pill.style.transform = `translateX(${link.offsetLeft}px)`;
  };
  const active = () => nav.querySelector<HTMLElement>('a[aria-current="page"]');
  nav.querySelectorAll<HTMLElement>("a").forEach((a) => a.addEventListener("pointerenter", () => moveTo(a)));
  nav.addEventListener("pointerleave", () => moveTo(active()));
  // Après une navigation, le lien actif change : la pilule suit
  new MutationObserver(() => moveTo(active())).observe(nav, {
    subtree: true,
    attributes: true,
    attributeFilter: ["aria-current"],
  });
  moveTo(active());
}

export function mountMenu(menu: HTMLElement) {
  if (!once(menu, "menu")) return;
  const openers = document.querySelectorAll<HTMLElement>("[data-menu-open]");
  const preview = menu.querySelector<HTMLElement>("[data-menu-preview]");

  const setOpen = (open: boolean) => {
    menu.dataset.open = String(open);
    menu.hidden = !open;
    document.body.style.overflow = open ? "hidden" : "";
    openers.forEach((b) => b.setAttribute("aria-expanded", String(open)));
    if (open) menu.querySelector<HTMLElement>("[data-menu-item] a, a[data-menu-item]")?.focus();
  };

  openers.forEach((b) => b.addEventListener("click", () => setOpen(menu.hidden)));
  menu
    .querySelectorAll<HTMLElement>("[data-menu-close], a")
    .forEach((el) => el.addEventListener("click", () => setOpen(false)));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !menu.hidden) setOpen(false);
  });

  // Survol d'un lien : le panneau de droite affiche sa description
  menu.querySelectorAll<HTMLElement>("[data-preview-title]").forEach((item) => {
    const show = () => {
      if (!preview) return;
      preview.querySelector("[data-p-title]")!.textContent = item.dataset.previewTitle ?? "";
      preview.querySelector("[data-p-text]")!.textContent = item.dataset.previewText ?? "";
      preview.querySelector("[data-p-tag]")!.textContent = item.dataset.previewTag ?? "";
    };
    item.addEventListener("pointerenter", show);
    item.addEventListener("focusin", show);
  });
}

/** La barre se remplit de 0 à 100 % entre le haut et le bas de la page. */
export function mountScrollProgress(bar: HTMLElement) {
  if (!once(bar, "progress")) return;
  const update = throttleFrame(() => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
  });
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  update();
}

/**
 * Lien vers une ancre de la page (href="#mois-2026-10") : on défile en douceur
 * au lieu de sauter. preventDefault() évite aussi de modifier l'adresse.
 */
export function mountScrollTo(link: HTMLElement) {
  if (!once(link, "scrollTo")) return;
  link.addEventListener("click", (e) => {
    const id = link.getAttribute("href")?.slice(1);
    const target = id ? document.getElementById(id) : null;
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "start" });
  });
}
