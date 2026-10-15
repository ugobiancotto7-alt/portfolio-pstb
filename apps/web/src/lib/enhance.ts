/**
 * Les interactions du site, en JavaScript "pur" (sans React).
 *
 * Pourquoi pas en React ? Ces effets ne changent pas les données, ils
 * animent du HTML déjà affiché. Les écrire en pur JS, branchés sur des
 * attributs data-*, permet de les réutiliser tels quels ailleurs (par
 * exemple dans l'aperçu statique du site). Le composant <Enhancer />
 * appelle simplement enhance() après chaque changement de page.
 *
 *   data-neural          <canvas> : sphère neuronale 3D interactive
 *   data-tilt            carte qui s'incline sous la souris
 *   data-nav             barre de navigation avec surligneur glissant
 *   data-menu / data-menu-open / data-menu-close   menu plein écran
 *   data-menu-preview    zone qui change selon le lien survolé du menu
 */

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Lance tous les effets présents dans `root`. Sans danger si appelé plusieurs fois. */
export function enhance(root: ParentNode = document) {
  root.querySelectorAll<HTMLCanvasElement>("canvas[data-neural]").forEach(mountNeuralSphere);
  root.querySelectorAll<HTMLElement>("[data-tilt]").forEach(mountTilt);
  root.querySelectorAll<HTMLElement>("[data-nav]").forEach(mountNavIndicator);
  root.querySelectorAll<HTMLElement>("[data-menu]").forEach(mountMenu);
}

// Évite de brancher deux fois le même élément
function once(el: HTMLElement | HTMLCanvasElement, key: string) {
  if (el.dataset[key] === "1") return false;
  el.dataset[key] = "1";
  return true;
}

/* ------------------------------------------------------------------ */
/* 1. Sphère neuronale en 3D                                           */
/* ------------------------------------------------------------------ */
/*
 * On place ~140 points sur une sphère (spirale de Fibonacci, pour une
 * répartition régulière), on relie chaque point à ses voisins proches,
 * puis à chaque image :
 *   1. on fait tourner les points (matrices de rotation autour de X et Y),
 *   2. on les projette en 2D avec une perspective simple : x' = x * f / (f + z),
 *   3. on dessine les liens et les points, plus clairs quand ils sont proches.
 * La souris (ou le doigt) fait pivoter la sphère. Pas de librairie 3D :
 * c'est exactement ce que font Three.js et les moteurs de jeu, en petit.
 */
function mountNeuralSphere(canvas: HTMLCanvasElement) {
  if (!once(canvas, "mounted")) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const N = 140;
  const points: [number, number, number][] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = golden * i;
    points.push([Math.cos(theta) * r, y, Math.sin(theta) * r]);
  }
  // Liens entre voisins proches (calculés une seule fois)
  const links: [number, number][] = [];
  for (let i = 0; i < N; i++)
    for (let j = i + 1; j < N; j++) {
      const [a, b, c] = points[i],
        [d, e, f] = points[j];
      if ((a - d) ** 2 + (b - e) ** 2 + (c - f) ** 2 < 0.13) links.push([i, j]);
    }
  // Quelques "signaux" qui voyagent le long des liens
  const pulses = Array.from({ length: 14 }, () => ({
    link: Math.floor(Math.random() * links.length),
    t: Math.random(),
  }));

  let rotX = 0.35,
    rotY = 0,
    targetX = 0.35,
    targetY = 0,
    autoSpin = 0.0022;
  let width = 0,
    height = 0,
    dpr = 1;

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
  };
  resize();
  window.addEventListener("resize", resize);

  const onPointer = (clientX: number, clientY: number) => {
    const rect = canvas.getBoundingClientRect();
    const nx = (clientX - rect.left) / rect.width - 0.5;
    const ny = (clientY - rect.top) / rect.height - 0.5;
    targetY = nx * 2.2;
    targetX = 0.35 + ny * 1.4;
  };
  canvas.addEventListener("pointermove", (e) => onPointer(e.clientX, e.clientY));
  canvas.addEventListener("pointerleave", () => (targetX = 0.35));

  const color = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || "#8b8bff";

  let frame = 0;
  const draw = () => {
    if (!canvas.isConnected) return; // la page a changé : on arrête
    frame++;
    targetY += reducedMotion() ? 0 : autoSpin;
    rotX += (targetX - rotX) * 0.05;
    rotY += (targetY - rotY) * 0.05;

    const cosX = Math.cos(rotX),
      sinX = Math.sin(rotX),
      cosY = Math.cos(rotY),
      sinY = Math.sin(rotY);
    const R = Math.min(width, height) * 0.38;
    const f = 2.6; // distance de la "caméra"
    const accent = color("--accent"),
      accent2 = color("--accent-2");

    // Rotation + projection de chaque point
    const proj = points.map(([x, y, z]) => {
      const x1 = x * cosY - z * sinY;
      const z1 = x * sinY + z * cosY;
      const y2 = y * cosX - z1 * sinX;
      const z2 = y * sinX + z1 * cosX;
      const s = f / (f + z2);
      return { x: width / 2 + x1 * R * s, y: height / 2 + y2 * R * s, z: z2, s };
    });

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    // Liens : plus visibles à l'avant (z négatif = vers nous)
    ctx.lineWidth = 1;
    for (const [i, j] of links) {
      const a = proj[i],
        b = proj[j];
      const depth = 1 - (a.z + b.z + 2) / 4;
      ctx.strokeStyle = accent;
      ctx.globalAlpha = 0.06 + depth * 0.32;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }

    // Signaux lumineux
    ctx.fillStyle = accent2;
    for (const p of pulses) {
      p.t += 0.012;
      if (p.t > 1) {
        p.t = 0;
        p.link = Math.floor(Math.random() * links.length);
      }
      const [i, j] = links[p.link];
      const a = proj[i],
        b = proj[j];
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.arc(a.x + (b.x - a.x) * p.t, a.y + (b.y - a.y) * p.t, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Points (neurones)
    proj.forEach((p, i) => {
      const depth = 1 - (p.z + 1) / 2;
      ctx.globalAlpha = 0.25 + depth * 0.75;
      ctx.fillStyle = i % 9 === 0 ? accent2 : accent;
      ctx.beginPath();
      ctx.arc(p.x, p.y, (1.4 + depth * 2.6) * p.s, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    if (!reducedMotion() || frame < 2) requestAnimationFrame(draw);
  };
  requestAnimationFrame(draw);
}

/* ------------------------------------------------------------------ */
/* 2. Cartes inclinables                                               */
/* ------------------------------------------------------------------ */
function mountTilt(el: HTMLElement) {
  if (!once(el, "tilt")) return;
  const max = Number(el.dataset.tilt) || 8; // angle maximum en degrés
  el.addEventListener("pointermove", (e) => {
    if (reducedMotion() || e.pointerType === "touch") return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--ry", `${px * max}deg`);
    el.style.setProperty("--rx", `${-py * max}deg`);
    el.style.setProperty("--mx", `${(px + 0.5) * 100}%`);
    el.style.setProperty("--my", `${(py + 0.5) * 100}%`);
  });
  el.addEventListener("pointerleave", () => {
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--rx", "0deg");
  });
}

/* ------------------------------------------------------------------ */
/* 3. Navigation avec surligneur glissant                              */
/* ------------------------------------------------------------------ */
function mountNavIndicator(nav: HTMLElement) {
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
  // Après une navigation, le lien actif change : on suit
  new MutationObserver(() => moveTo(active())).observe(nav, {
    subtree: true,
    attributes: true,
    attributeFilter: ["aria-current"],
  });
  moveTo(active());
}

/* ------------------------------------------------------------------ */
/* 4. Menu plein écran                                                 */
/* ------------------------------------------------------------------ */
function mountMenu(menu: HTMLElement) {
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
