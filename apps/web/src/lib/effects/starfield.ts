/**
 * Fond étoilé : <canvas data-starfield> (ou data-starfield="soft", plus discret).
 *
 * Chaque étoile a une profondeur z entre 0 (très loin) et 1 (proche) :
 *   - plus elle est proche, plus elle est grosse et lumineuse ;
 *   - quand la souris bouge, les étoiles proches se déplacent plus que les
 *     lointaines : c'est l'effet de parallaxe qui donne la profondeur ;
 *   - chacune scintille à son propre rythme (une sinusoïde décalée).
 * De temps en temps, une étoile filante traverse le ciel.
 */
import { animate, cssVar, fitCanvas, once, reducedMotion } from "./util";

interface Star {
  x: number; // position horizontale, entre 0 et 1 (fraction de la largeur)
  y: number;
  z: number; // profondeur
  r: number; // rayon en pixels
  phase: number; // décalage du scintillement
  speed: number; // vitesse du scintillement
  rgb: string; // couleur "r g b"
}

interface Shooting {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number; // de 0 (naissance) à 1 (disparition)
}

export function mountStarfield(canvas: HTMLCanvasElement) {
  if (!once(canvas, "stars")) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const soft = canvas.dataset.starfield === "soft";
  let stars: Star[] = [];

  const makeStars = () => {
    const base = cssVar(canvas, "--star", "226 232 255");
    const accent2 = cssVar(canvas, "--star-tint", "34 211 238");
    const density = soft ? 5200 : 2100; // 1 étoile pour N pixels²
    const count = Math.min(soft ? 180 : 620, Math.round((size.width * size.height) / density));
    stars = Array.from({ length: count }, () => {
      const z = Math.random() ** 1.8; // beaucoup d'étoiles lointaines, peu de proches
      const roll = Math.random();
      return {
        x: Math.random(),
        y: Math.random(),
        z,
        r: 0.35 + z * (soft ? 1.1 : 1.5),
        phase: Math.random() * Math.PI * 2,
        speed: 0.6 + Math.random() * 1.8,
        // 85 % blanc bleuté, 10 % cyan, 5 % orangé (comme de vraies étoiles)
        rgb: roll < 0.85 ? base : roll < 0.95 ? accent2 : "255 210 170",
      };
    });
  };
  // Après un redimensionnement, le canvas est vidé : on recrée les étoiles et on redessine
  const size = fitCanvas(canvas, () => {
    makeStars();
    loop.kick();
  });
  makeStars();

  // Parallaxe : la zone qui écoute la souris est le parent (le canvas est en arrière-plan)
  const zone = canvas.parentElement ?? canvas;
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  zone.addEventListener("pointermove", (e) => {
    const r = zone.getBoundingClientRect();
    pointer.tx = (e.clientX - r.left) / r.width - 0.5;
    pointer.ty = (e.clientY - r.top) / r.height - 0.5;
    loop.kick();
  });
  zone.addEventListener("pointerleave", () => {
    pointer.tx = 0;
    pointer.ty = 0;
  });

  const shooting: Shooting[] = [];
  let nextShot = 1500 + Math.random() * 2500;
  let last = 0;
  let t = 0;

  const loop = animate(canvas, (now) => {
    const dt = last ? Math.min(50, now - last) : 16;
    last = now;
    const still = reducedMotion();
    if (!still) t += dt / 1000;

    const { width: W, height: H, dpr } = size;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    pointer.x += (pointer.tx - pointer.x) * 0.05;
    pointer.y += (pointer.ty - pointer.y) * 0.05;

    for (const s of stars) {
      // Dérive très lente vers la gauche, plus rapide pour les étoiles proches
      if (!still) s.x = (s.x - 0.0000045 * dt * (0.2 + s.z) + 1) % 1;
      const x = s.x * W - pointer.x * s.z * 36;
      const y = s.y * H - pointer.y * s.z * 26;
      const twinkle = 0.6 + 0.4 * Math.sin(t * s.speed + s.phase);
      const alpha = (0.25 + s.z * 0.75) * twinkle * (soft ? 0.7 : 1);

      ctx.globalAlpha = alpha;
      ctx.fillStyle = `rgb(${s.rgb})`;
      ctx.beginPath();
      ctx.arc(x, y, s.r, 0, Math.PI * 2);
      ctx.fill();

      // Les plus proches ont un halo, et les toutes premières une petite croix de lumière
      if (s.z > 0.9 && !soft) {
        ctx.globalAlpha = alpha * 0.16;
        ctx.beginPath();
        ctx.arc(x, y, s.r * 3.5, 0, Math.PI * 2);
        ctx.fill();
        if (s.z > 0.97) {
          ctx.globalAlpha = alpha * 0.3;
          ctx.strokeStyle = `rgb(${s.rgb})`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(x - s.r * 3.5, y);
          ctx.lineTo(x + s.r * 3.5, y);
          ctx.moveTo(x, y - s.r * 3.5);
          ctx.lineTo(x, y + s.r * 3.5);
          ctx.stroke();
        }
      }
    }

    // Étoiles filantes (pas dans la version discrète, ni avec "moins d'animations")
    if (!soft && !still) {
      nextShot -= dt;
      if (nextShot <= 0) {
        nextShot = 3500 + Math.random() * 5000;
        const angle = (200 + Math.random() * 20) * (Math.PI / 180); // vers le bas à gauche
        const speed = 0.9 + Math.random() * 0.5; // pixels par milliseconde
        shooting.push({
          x: W * (0.35 + Math.random() * 0.75),
          y: H * (Math.random() * 0.35),
          vx: Math.cos(angle) * speed,
          vy: -Math.sin(angle) * speed,
          life: 0,
        });
      }
      for (let i = shooting.length - 1; i >= 0; i--) {
        const s = shooting[i];
        s.life += dt / 900;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        if (s.life >= 1) {
          shooting.splice(i, 1);
          continue;
        }
        const fade = Math.sin(s.life * Math.PI); // apparaît puis s'éteint en douceur
        const tail = 140;
        const len = Math.hypot(s.vx, s.vy);
        const tx = s.x - (s.vx / len) * tail,
          ty = s.y - (s.vy / len) * tail;
        const grad = ctx.createLinearGradient(s.x, s.y, tx, ty);
        grad.addColorStop(0, "rgb(255 255 255 / 0.95)");
        grad.addColorStop(1, "rgb(139 139 255 / 0)");
        ctx.globalAlpha = fade;
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.4;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(tx, ty);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  });
}
