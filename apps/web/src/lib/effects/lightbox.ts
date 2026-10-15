/**
 * Visionneuse photo plein écran : <ul data-lightbox> dont chaque photo a un
 * attribut data-full (l'image en grand) et data-caption (sa légende).
 *
 * On utilise l'élément HTML <dialog> : le navigateur gère pour nous la mise
 * au premier plan, le fond assombri (::backdrop) et la touche Échap.
 * Flèches du clavier, boutons ou glissement du doigt pour passer d'une photo à l'autre.
 */
import { once } from "./util";

export function mountLightbox(gallery: HTMLElement) {
  if (!once(gallery, "lightbox")) return;
  const items = [...gallery.querySelectorAll<HTMLElement>("[data-full]")];
  if (items.length === 0) return;

  const dialog = document.createElement("dialog");
  dialog.className = "lightbox";
  dialog.setAttribute("aria-label", "Photo en plein écran");
  dialog.innerHTML = `
    <figure>
      <img alt="" />
      <figcaption><span data-lb-count></span><span data-lb-caption></span></figcaption>
    </figure>
    <button type="button" data-lb-prev aria-label="Photo précédente">‹</button>
    <button type="button" data-lb-next aria-label="Photo suivante">›</button>
    <button type="button" data-lb-close aria-label="Fermer">Fermer <kbd>esc</kbd></button>`;
  document.body.append(dialog);

  const img = dialog.querySelector("img")!;
  const count = dialog.querySelector<HTMLElement>("[data-lb-count]")!;
  const caption = dialog.querySelector<HTMLElement>("[data-lb-caption]")!;
  let index = 0;

  const show = (i: number) => {
    index = (i + items.length) % items.length; // boucle : après la dernière, la première
    const item = items[index];
    img.classList.remove("is-in");
    img.src = item.dataset.full!;
    img.alt = item.dataset.caption ?? "";
    count.textContent = `${String(index + 1).padStart(2, "0")} / ${String(items.length).padStart(2, "0")}`;
    caption.textContent = item.dataset.caption ?? "";
    // L'image apparaît en zoomant légèrement une fois chargée
    (img.decode ? img.decode() : Promise.resolve()).catch(() => {}).finally(() => img.classList.add("is-in"));
  };

  items.forEach((item, i) => {
    item.setAttribute("role", "button");
    item.setAttribute("tabindex", "0");
    item.setAttribute("aria-label", `Agrandir la photo ${i + 1}`);
    const open = () => {
      show(i);
      dialog.showModal();
    };
    item.addEventListener("click", open);
    item.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open();
      }
    });
  });

  dialog.querySelector("[data-lb-prev]")!.addEventListener("click", () => show(index - 1));
  dialog.querySelector("[data-lb-next]")!.addEventListener("click", () => show(index + 1));
  dialog.querySelector("[data-lb-close]")!.addEventListener("click", () => dialog.close());
  // Un clic sur le fond (et pas sur la photo) ferme aussi
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) dialog.close();
  });
  dialog.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") show(index - 1);
    if (e.key === "ArrowRight") show(index + 1);
  });

  // Glisser du doigt vers la gauche ou la droite (mobile)
  let startX = 0;
  dialog.addEventListener("touchstart", (e) => (startX = e.touches[0].clientX), { passive: true });
  dialog.addEventListener("touchend", (e) => {
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
  });

  // Si on quitte la page, on retire la visionneuse
  const cleanup = new MutationObserver(() => {
    if (!gallery.isConnected) {
      dialog.remove();
      cleanup.disconnect();
    }
  });
  cleanup.observe(document.body, { childList: true, subtree: true });
}
