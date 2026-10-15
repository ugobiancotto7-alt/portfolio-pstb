/**
 * La planète neuronale de l'accueil : <canvas data-neural>.
 *
 * Comment c'est construit, sans librairie 3D :
 *   1. ~140 points répartis sur une sphère (spirale de Fibonacci), reliés à
 *      leurs voisins proches : c'est le "réseau de neurones".
 *   2. À chaque image, on fait tourner ces points (rotation autour de Y puis
 *      de X) et on les projette en 2D avec une perspective : x' = x × f / (f + z).
 *      C'est exactement ce que font Three.js et les moteurs de jeu, en petit.
 *   3. Pour en faire une planète : un disque sombre éclairé en haut à gauche
 *      (il cache les étoiles derrière lui), une atmosphère lumineuse autour,
 *      un anneau de particules et une petite lune qui passent DEVANT puis
 *      DERRIÈRE la planète (on dessine la moitié arrière avant le disque et
 *      la moitié avant après lui).
 *   4. Un marqueur "Nous sommes ici" placé sur Paris grâce à sa latitude
 *      et sa longitude.
 * La souris (ou le doigt) fait pivoter la planète.
 */
import { animate, cssVar, fitCanvas, hexToRgb, once, reducedMotion } from "./util";

type Vec3 = [number, number, number];

const F = 2.6; // distance de la "caméra" : plus elle est petite, plus la perspective est forte
const RADIUS = 0.28; // rayon de la planète, en fraction du plus petit côté du canvas
const SILHOUETTE = 1.08; // une sphère vue en perspective paraît un peu plus grande que son rayon

export function mountPlanet(canvas: HTMLCanvasElement) {
  if (!once(canvas, "mounted")) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  /* ---------- 1. Le réseau de neurones à la surface ---------- */
  const N = 140;
  const points: Vec3[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    points.push([Math.cos(golden * i) * r, y, Math.sin(golden * i) * r]);
  }
  // Liens entre voisins proches (calculés une seule fois)
  const links: [number, number][] = [];
  for (let i = 0; i < N; i++)
    for (let j = i + 1; j < N; j++) {
      const [a, b, c] = points[i],
        [d, e, f] = points[j];
      if ((a - d) ** 2 + (b - e) ** 2 + (c - f) ** 2 < 0.13) links.push([i, j]);
    }
  // Des "signaux" qui voyagent le long des liens
  const pulses = Array.from({ length: 14 }, () => ({
    link: Math.floor(Math.random() * links.length),
    t: Math.random(),
  }));

  /*
   * Paris : latitude 48,86° N, longitude 2,35° E. Conversion en 3D (rayon 1) :
   *   x = cos(lat) × cos(lon),  y = -sin(lat) (le haut de l'écran = le nord),  z = cos(lat) × sin(lon)
   */
  const lat = (48.8566 * Math.PI) / 180,
    lon = (2.3522 * Math.PI) / 180;
  const paris: Vec3 = [Math.cos(lat) * Math.cos(lon), -Math.sin(lat), Math.cos(lat) * Math.sin(lon)];

  /*
   * L'anneau : 420 particules entre 1,42 et 1,58 rayon. Comme dans le vrai
   * système solaire (lois de Kepler), celles de l'intérieur tournent plus vite.
   */
  const belt = Array.from({ length: 420 }, () => {
    const dist = 1.42 + Math.random() * 0.16;
    return { a: Math.random() * Math.PI * 2, dist, h: (Math.random() - 0.5) * 0.03, w: dist ** -1.5, r: Math.random() };
  });
  const MOON_DIST = 1.72;
  let moonA = 2.2;

  /* ---------- 2. Rotation : départ face à Paris, puis souris ---------- */
  const BASE_X = 0.62,
    BASE_Y = -Math.PI / 2 + 0.05;
  let rotX = BASE_X,
    rotY = BASE_Y,
    targetX = BASE_X,
    pointerY = 0,
    time = 0;

  const size = fitCanvas(canvas, () => loop.kick());

  const onPointer = (clientX: number, clientY: number) => {
    const rect = canvas.getBoundingClientRect();
    pointerY = ((clientX - rect.left) / rect.width - 0.5) * 1.8;
    targetX = BASE_X + ((clientY - rect.top) / rect.height - 0.5) * 1.2;
    loop.kick();
  };
  canvas.addEventListener("pointermove", (e) => onPointer(e.clientX, e.clientY));
  canvas.addEventListener("pointerleave", () => {
    targetX = BASE_X;
    pointerY = 0;
  });

  // Couleurs du thème, relues de temps en temps (si on change de thème)
  let colors = { accent: "#8b8bff", accent2: "#22d3ee", fg: "#eef0ff", acc: "139 139 255", acc2: "34 211 238" };
  const readColors = () => {
    const accent = cssVar(canvas, "--accent", "#8b8bff");
    const accent2 = cssVar(canvas, "--accent-2", "#22d3ee");
    colors = { accent, accent2, fg: cssVar(canvas, "--fg", "#eef0ff"), acc: hexToRgb(accent), acc2: hexToRgb(accent2) };
  };
  readColors();

  let frame = 0;
  const loop = animate(canvas, () => {
    frame++;
    if (frame % 60 === 0) readColors();
    const { accent, accent2, fg, acc, acc2 } = colors;
    const still = reducedMotion();
    if (!still) {
      time += 0.008;
      moonA += 0.0045;
      for (const p of belt) p.a += p.w * 0.0022;
    }
    // La planète oscille doucement autour de Paris pour qu'il reste visible
    const targetY = BASE_Y + Math.sin(time) * 0.75 + pointerY;
    rotX += (targetX - rotX) * 0.05;
    rotY += (targetY - rotY) * 0.05;

    const { width, height, dpr } = size;
    const cx = width / 2,
      cy = height / 2;
    const R = Math.min(width, height) * RADIUS;
    const Rs = R * SILHOUETTE;

    const cosX = Math.cos(rotX),
      sinX = Math.sin(rotX),
      cosY = Math.cos(rotY),
      sinY = Math.sin(rotY);

    // Rotation de la planète + projection en perspective
    const project = ([x, y, z]: Vec3) => {
      const x1 = x * cosY - z * sinY;
      const z1 = x * sinY + z * cosY;
      const y2 = y * cosX - z1 * sinX;
      const z2 = y * sinX + z1 * cosX;
      const s = F / (F + z2);
      return { x: cx + x1 * R * s, y: cy + y2 * R * s, z: z2, s };
    };

    // L'anneau ne tourne pas avec la planète : il est incliné de ~18° vers nous,
    // penché de ~16° sur le côté, et suit un peu la souris (parallaxe)
    const tilt = 0.32 + (rotX - BASE_X) * 0.25,
      roll = -0.28;
    const cosT = Math.cos(tilt),
      sinT = Math.sin(tilt),
      cosR = Math.cos(roll),
      sinR = Math.sin(roll);
    const projectRing = (angle: number, dist: number, h = 0) => {
      const x = Math.cos(angle) * dist,
        z = Math.sin(angle) * dist;
      const y = h * cosT - z * sinT,
        z1 = h * sinT + z * cosT;
      const xr = x * cosR - y * sinR,
        yr = x * sinR + y * cosR;
      const s = F / (F + z1);
      return { x: cx + xr * R * s, y: cy + yr * R * s, z: z1, s };
    };

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    // Atmosphère : un halo coloré autour de la planète
    const halo = ctx.createRadialGradient(cx, cy, Rs * 0.92, cx, cy, Rs * 1.55);
    halo.addColorStop(0, `rgb(${acc} / 0.34)`);
    halo.addColorStop(0.3, `rgb(${acc} / 0.12)`);
    halo.addColorStop(1, `rgb(${acc} / 0)`);
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, width, height);

    const beltPts = belt.map((p) => ({ ...projectRing(p.a, p.dist, p.h), r: p.r }));
    const moon = projectRing(moonA, MOON_DIST);
    // Le tracé de l'anneau, pour qu'il se lise même entre les particules
    const ringLine = Array.from({ length: 121 }, (_, i) => projectRing((i / 120) * Math.PI * 2, 1.5));
    const drawBelt = (front: boolean) => {
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1;
      for (let i = 0; i < 120; i++) {
        const a = ringLine[i],
          b = ringLine[i + 1];
        if (a.z < 0 !== front) continue;
        ctx.globalAlpha = front ? 0.22 : 0.1;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      for (const p of beltPts) {
        if (p.z < 0 !== front) continue;
        ctx.globalAlpha = (front ? 0.85 : 0.4) * (0.4 + p.r * 0.6);
        ctx.fillStyle = p.r > 0.85 ? accent2 : accent;
        ctx.beginPath();
        ctx.arc(p.x, p.y, (0.6 + p.r * 0.9) * p.s, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };
    const drawMoon = () => {
      const mr = R * 0.085 * moon.s;
      const g = ctx.createRadialGradient(moon.x - mr * 0.4, moon.y - mr * 0.4, mr * 0.1, moon.x, moon.y, mr);
      g.addColorStop(0, "#f1f3ff");
      g.addColorStop(0.6, "#9aa0d6");
      g.addColorStop(1, "#2b2f57");
      ctx.globalAlpha = 0.95;
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(moon.x, moon.y, mr, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    };

    // 1. Ce qui est DERRIÈRE la planète
    drawBelt(false);
    if (moon.z >= 0) drawMoon();

    // 2. Le corps de la planète, éclairé en haut à gauche
    const body = ctx.createRadialGradient(cx - Rs * 0.42, cy - Rs * 0.48, Rs * 0.08, cx, cy, Rs);
    body.addColorStop(0, `rgb(${acc} / 0.38)`);
    body.addColorStop(0.5, "rgb(12 14 34 / 0.94)");
    body.addColorStop(1, "rgb(5 6 14 / 0.98)");
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(cx, cy, Rs, 0, Math.PI * 2);
    ctx.fill();
    // Liseré de lumière sur le bord éclairé
    const rim = ctx.createLinearGradient(cx - Rs, cy - Rs, cx + Rs, cy + Rs);
    rim.addColorStop(0, `rgb(${acc2} / 0.55)`);
    rim.addColorStop(0.5, `rgb(${acc} / 0.15)`);
    rim.addColorStop(1, `rgb(${acc} / 0)`);
    ctx.strokeStyle = rim;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 3. Le réseau de neurones à la surface
    const proj = points.map(project);
    ctx.lineWidth = 1;
    ctx.strokeStyle = accent;
    for (const [i, j] of links) {
      const a = proj[i],
        b = proj[j];
      const depth = 1 - (a.z + b.z + 2) / 4; // 1 = face à nous, 0 = au dos
      ctx.globalAlpha = 0.04 + depth * depth * 0.42;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    ctx.fillStyle = accent2;
    for (const p of pulses) {
      if (!still) p.t += 0.012;
      if (p.t > 1) {
        p.t = 0;
        p.link = Math.floor(Math.random() * links.length);
      }
      const [i, j] = links[p.link];
      const a = proj[i],
        b = proj[j];
      if (a.z > 0.3) continue; // les signaux au dos de la planète restent cachés
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.arc(a.x + (b.x - a.x) * p.t, a.y + (b.y - a.y) * p.t, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    proj.forEach((p, i) => {
      const depth = 1 - (p.z + 1) / 2;
      ctx.globalAlpha = 0.12 + depth * 0.88;
      ctx.fillStyle = i % 9 === 0 ? accent2 : accent;
      ctx.beginPath();
      ctx.arc(p.x, p.y, (1.3 + depth * 2.5) * p.s, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // 4. Ce qui est DEVANT la planète
    drawBelt(true);
    if (moon.z < 0) drawMoon();

    // 5. Le marqueur "Nous sommes ici" sur Paris
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
      ctx.shadowColor = accent2;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(pin.x, pin.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Trait + étiquette vers le haut, du côté où il reste de la place
      const dir = pin.x > width / 2 ? -1 : 1;
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
  });
}
