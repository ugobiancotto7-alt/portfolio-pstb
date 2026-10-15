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
  root.querySelectorAll<HTMLElement>("[data-spotlight]").forEach(mountSpotlight);
  root.querySelectorAll<HTMLElement>("[data-count]").forEach(mountCountUp);
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

  /*
   * Paris sur la sphère, vue comme un globe : latitude 48,86° N,
   * longitude 2,35° E. Conversion en coordonnées 3D (rayon 1) :
   *   x = cos(lat) × cos(lon),  y = -sin(lat) (le haut de l'écran = le nord),
   *   z = cos(lat) × sin(lon)
   */
  const lat = (48.8566 * Math.PI) / 180,
    lon = (2.3522 * Math.PI) / 180;
  const paris: [number, number, number] = [
    Math.cos(lat) * Math.cos(lon),
    -Math.sin(lat),
    Math.cos(lat) * Math.sin(lon),
  ];

  // Rotation de départ choisie pour que Paris soit face à nous
  const BASE_X = 0.62,
    BASE_Y = -Math.PI / 2 + 0.05;
  let rotX = BASE_X,
    rotY = BASE_Y,
    targetX = BASE_X,
    pointerY = 0,
    time = 0;
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
    pointerY = nx * 1.8;
    targetX = BASE_X + ny * 1.2;
  };
  canvas.addEventListener("pointermove", (e) => onPointer(e.clientX, e.clientY));
  canvas.addEventListener("pointerleave", () => {
    targetX = BASE_X;
    pointerY = 0;
  });

  const color = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || "#8b8bff";

  let frame = 0;
  const draw = () => {
    if (!canvas.isConnected) return; // la page a changé : on arrête
    frame++;
    // La sphère oscille doucement autour de Paris pour qu'il reste visible
    if (!reducedMotion()) time += 0.008;
    const targetY = BASE_Y + Math.sin(time) * 0.75 + pointerY;
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

    // Rotation (autour de Y puis de X) + projection en perspective d'un point
    const project = ([x, y, z]: [number, number, number]) => {
      const x1 = x * cosY - z * sinY;
      const z1 = x * sinY + z * cosY;
      const y2 = y * cosX - z1 * sinX;
      const z2 = y * sinX + z1 * cosX;
      const s = f / (f + z2);
      return { x: width / 2 + x1 * R * s, y: height / 2 + y2 * R * s, z: z2, s };
    };
    const proj = points.map(project);

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

    // Le marqueur "Nous sommes ici" sur Paris
    const fg = color("--fg");
    const pin = project(paris);
    const visible = Math.max(0, Math.min(1, (-pin.z + 0.15) * 3)); // s'efface quand Paris passe derrière
    if (visible > 0) {
      const pulse = (frame % 90) / 90; // anneau qui grandit puis disparaît, en boucle
      ctx.globalAlpha = visible * (1 - pulse);
      ctx.strokeStyle = accent2;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(pin.x, pin.y, 5 + pulse * 18, 0, Math.PI * 2);
      ctx.stroke();

      ctx.globalAlpha = visible;
      ctx.fillStyle = accent2;
      ctx.beginPath();
      ctx.arc(pin.x, pin.y, 5, 0, Math.PI * 2);
      ctx.fill();

      // Trait + étiquette vers le haut, du côté où il reste de la place
      // (à gauche si Paris est dans la moitié droite, sinon le texte sortirait du cadre)
      const dir = pin.x > canvas.clientWidth / 2 ? -1 : 1;
      const lx = pin.x + 34 * dir,
        ly = pin.y - 34;
      ctx.strokeStyle = accent2;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pin.x + 4 * dir, pin.y - 4);
      ctx.lineTo(lx, ly);
      ctx.lineTo(lx + 12 * dir, ly);
      ctx.stroke();
      ctx.textBaseline = "middle";
      ctx.textAlign = dir > 0 ? "left" : "right";
      ctx.font = '600 14px "Geist", system-ui, sans-serif';
      ctx.fillStyle = fg;
      ctx.fillText("Nous sommes ici", lx + 18 * dir, ly - 8);
      ctx.font = '500 11px "Geist Mono", ui-monospace, monospace';
      ctx.fillStyle = accent2;
      ctx.fillText("PARIS · 48.86°N 2.35°E", lx + 18 * dir, ly + 9);
      ctx.textAlign = "left";
      ctx.globalAlpha = 1;
    }

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

/* ------------------------------------------------------------------ */
/* Halo qui suit la souris sur une carte                               */
/* ------------------------------------------------------------------ */
/*
 * On donne au CSS la position de la souris dans la carte (--mx, --my).
 * Un dégradé radial centré sur ce point crée la "lampe torche"
 * (voir .metric-card dans globals.css).
 */
function mountSpotlight(el: HTMLElement) {
  if (!once(el, "spot")) return;
  el.addEventListener("pointermove", (e) => {
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  });
}

/* ------------------------------------------------------------------ */
/* Compteur animé : 00 -> valeur quand le chiffre apparaît à l'écran   */
/* ------------------------------------------------------------------ */
/*
 * Le vrai chiffre est déjà dans le HTML (utile sans JavaScript et pour
 * Google). IntersectionObserver prévient quand l'élément devient visible,
 * puis requestAnimationFrame fait défiler les nombres en ~1,2 s avec un
 * ralenti en fin de course (easeOutCubic).
 */
function mountCountUp(el: HTMLElement) {
  if (!once(el, "counted")) return;
  const target = Number(el.dataset.count) || 0;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
  const fmt = (n: number) => String(n).padStart(2, "0");
  const run = () => {
    const t0 = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / 1200);
      el.textContent = fmt(Math.round(target * (1 - (1 - t) ** 3)));
      if (t < 1) requestAnimationFrame(step);
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
