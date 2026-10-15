/**
 * Les effets de la page Timeline.
 *
 *   <canvas data-orbit='{...}'>  l'année vue comme une orbite en 3D : les 12 mois
 *                                autour d'un soleil, et une comète "Aujourd'hui"
 *   data-timeline                la frise verticale : les cartes pivotent en 3D
 *                                selon leur position à l'écran, la ligne se remplit
 *   data-month-nav               la barre des mois : suit le mois en cours de lecture
 */
import { animate, clamp, cssVar, fitCanvas, hexToRgb, once, reducedMotion, throttleFrame } from "./util";

/** Ce que la page passe au canvas, en JSON dans l'attribut data-orbit. */
export interface OrbitData {
  months: { short: string; long: string; count: number; anchor: string | null; future: boolean }[];
  /** Fraction de l'année scolaire déjà écoulée, de 0 (1er septembre) à 1 */
  progress: number;
  todayLabel: string;
}

/* ------------------------------------------------------------------ */
/* 1. L'orbite de l'année                                              */
/* ------------------------------------------------------------------ */
/*
 * Une année = un tour d'orbite, comme la Terre autour du Soleil.
 * Un point de l'orbite à la fraction p de l'année (0 → 1) est d'abord placé
 * sur un cercle à plat (x = cos φ, z = sin φ), puis on incline ce cercle
 * vers nous (rotation autour de l'axe X) et on le projette en perspective.
 * On choisit le décalage φ pour que "aujourd'hui" soit toujours devant :
 * le passé part à gauche, l'avenir à droite.
 */
export function mountOrbit(canvas: HTMLCanvasElement) {
  if (!once(canvas, "orbit")) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  let data: OrbitData;
  try {
    data = JSON.parse(canvas.dataset.orbit ?? "");
  } catch {
    return;
  }

  const F = 3.4;
  const TWO_PI = Math.PI * 2;
  const size = fitCanvas(canvas, () => loop.kick());

  // État de la caméra : inclinaison et rotation, qui suivent la souris en douceur
  const BASE_TILT = 0.45; // ~26° : on regarde l'orbite légèrement du dessus
  let tilt = BASE_TILT,
    tiltTarget = BASE_TILT,
    dragYaw = 0,
    hoverYaw = 0,
    time = 0;
  let hovered = -1;
  let dragging: { x: number; y: number; yaw: number; tilt: number; moved: boolean } | null = null;

  // Positions des mois à l'écran, mises à jour à chaque image (pour le survol et le clic)
  let monthScreen: { x: number; y: number; z: number; s: number }[] = [];

  const pick = (clientX: number, clientY: number) => {
    const r = canvas.getBoundingClientRect();
    const x = clientX - r.left,
      y = clientY - r.top;
    let best = -1,
      bestD = 26;
    monthScreen.forEach((m, i) => {
      const d = Math.hypot(m.x - x, m.y - y);
      if (d < bestD) {
        best = i;
        bestD = d;
      }
    });
    return best;
  };

  canvas.addEventListener("pointerdown", (e) => {
    dragging = { x: e.clientX, y: e.clientY, yaw: dragYaw, tilt: tiltTarget, moved: false };
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointermove", (e) => {
    const r = canvas.getBoundingClientRect();
    if (dragging) {
      const dx = e.clientX - dragging.x,
        dy = e.clientY - dragging.y;
      if (Math.abs(dx) + Math.abs(dy) > 4) dragging.moved = true;
      dragYaw = dragging.yaw - dx * 0.006; // glisser vers la droite fait défiler l'année
      tiltTarget = clamp(dragging.tilt + dy * 0.004, 0.22, 1.05);
    } else {
      hoverYaw = -((e.clientX - r.left) / r.width - 0.5) * 0.35;
      tiltTarget = BASE_TILT + ((e.clientY - r.top) / r.height - 0.5) * 0.25;
    }
    hovered = pick(e.clientX, e.clientY);
    canvas.style.cursor = dragging?.moved
      ? "grabbing"
      : hovered >= 0 && data.months[hovered].anchor
        ? "pointer"
        : "grab";
    loop.kick();
  });
  const endDrag = (e: PointerEvent) => {
    const wasClick = dragging && !dragging.moved;
    dragging = null;
    if (!wasClick) return;
    const i = pick(e.clientX, e.clientY);
    const anchor = i >= 0 ? data.months[i].anchor : null;
    if (anchor)
      document
        .getElementById(anchor)
        ?.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "start" });
  };
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", () => (dragging = null));
  canvas.addEventListener("pointerleave", () => {
    hovered = -1;
    hoverYaw = 0;
    tiltTarget = BASE_TILT;
  });

  let colors = { acc: "139 139 255", acc2: "34 211 238", fg: "#eef0ff", muted: "#8b90ad", bg: "#06070d" };
  const readColors = () => {
    colors = {
      acc: hexToRgb(cssVar(canvas, "--accent", "#8b8bff")),
      acc2: hexToRgb(cssVar(canvas, "--accent-2", "#22d3ee")),
      fg: cssVar(canvas, "--fg", "#eef0ff"),
      muted: cssVar(canvas, "--muted", "#8b90ad"),
      bg: cssVar(canvas, "--bg", "#06070d"),
    };
  };
  readColors();

  let frame = 0;
  const loop = animate(canvas, () => {
    frame++;
    if (frame % 60 === 0) readColors();
    const { acc, acc2, fg, muted, bg } = colors;
    if (!reducedMotion()) time += 0.01;

    tilt += (tiltTarget - tilt) * 0.06;
    const yaw = -Math.PI / 2 - data.progress * TWO_PI + dragYaw + hoverYaw + Math.sin(time * 0.4) * 0.12;
    const cosT = Math.cos(tilt),
      sinT = Math.sin(tilt);

    const { width: W, height: H, dpr } = size;
    const compact = W < 560; // sur mobile, on allège les étiquettes
    // Taille de l'orbite : assez de place en bas pour l'étiquette "Aujourd'hui",
    // et décalée à droite sur grand écran (le texte de présentation est à gauche)
    const K = Math.min(W * (compact ? 0.42 : 0.36), H * (compact ? 0.5 : 0.56));
    const cx = compact ? W / 2 : W * 0.6,
      cy = H * (compact ? 0.52 : 0.4);

    // Fraction de l'année -> position à l'écran
    const at = (p: number, dist = 1) => {
      const phi = p * TWO_PI + yaw;
      const x = Math.cos(phi) * dist,
        z = Math.sin(phi) * dist;
      const y2 = -z * sinT,
        z2 = z * cosT;
      const s = F / (F + z2);
      return { x: cx + x * K * s, y: cy + y2 * K * s, z: z2, s };
    };
    const depthAlpha = (z: number) => 0.25 + (1 - (z + 1) / 2) * 0.75; // devant = opaque

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    // Le soleil au centre : un cœur blanc et un grand halo
    const sunR = K * 0.09;
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, sunR * 5);
    glow.addColorStop(0, `rgb(${acc2} / 0.35)`);
    glow.addColorStop(0.25, `rgb(${acc} / 0.16)`);
    glow.addColorStop(1, `rgb(${acc} / 0)`);
    const drawSun = () => {
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, sunR * 5, 0, TWO_PI);
      ctx.fill();
      const core = ctx.createRadialGradient(cx - sunR * 0.3, cy - sunR * 0.3, 0, cx, cy, sunR);
      core.addColorStop(0, "#ffffff");
      core.addColorStop(0.5, `rgb(${acc2})`);
      core.addColorStop(1, `rgb(${acc})`);
      ctx.fillStyle = core;
      ctx.shadowColor = `rgb(${acc2})`;
      ctx.shadowBlur = 30 + Math.sin(time * 2) * 8;
      ctx.beginPath();
      ctx.arc(cx, cy, sunR, 0, TWO_PI);
      ctx.fill();
      ctx.shadowBlur = 0;
    };

    // L'orbite, puis la partie déjà parcourue de l'année (plus épaisse, en dégradé)
    const STEPS = 240;
    const orbit = Array.from({ length: STEPS + 1 }, (_, i) => at(i / STEPS));
    const drawPath = (front: boolean) => {
      for (let i = 0; i < STEPS; i++) {
        const a = orbit[i],
          b = orbit[i + 1];
        if (a.z < 0 !== front) continue;
        const p = i / STEPS;
        const done = p <= data.progress;
        ctx.globalAlpha = depthAlpha(a.z) * (done ? 1 : 0.45);
        ctx.strokeStyle = done ? `rgb(${p < data.progress * 0.5 ? acc : acc2})` : muted;
        ctx.lineWidth = (done ? 2.6 : 1) * a.s;
        if (!done) ctx.setLineDash([2, 5]);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.globalAlpha = 1;
    };

    // Les mois : traits de séparation + un point au milieu de chaque mois.
    // Un mois qui a des entrées porte un badge posé juste à l'extérieur de
    // l'orbite (pour ne jamais être caché par la comète).
    const BADGE = 1.14;
    monthScreen = data.months.map((m, k) => at((k + 0.5) / 12, m.count > 0 ? BADGE : 1));
    const drawMonths = (front: boolean) => {
      data.months.forEach((m, k) => {
        const p = monthScreen[k];
        if (p.z < 0 !== front) return;
        const a = depthAlpha(p.z);
        const isHover = k === hovered;

        // Séparateur entre deux mois
        const tIn = at(k / 12, 0.96),
          tOut = at(k / 12, 1.04);
        ctx.globalAlpha = a * 0.5;
        ctx.strokeStyle = muted;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(tIn.x, tIn.y);
        ctx.lineTo(tOut.x, tOut.y);
        ctx.stroke();

        // Le point du mois
        ctx.globalAlpha = a;
        if (m.count > 0) {
          // Petit trait qui relie le badge à l'orbite
          const foot = at((k + 0.5) / 12, 1);
          ctx.strokeStyle = `rgb(${acc2})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(foot.x, foot.y);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
          ctx.fillStyle = `rgb(${acc2})`;
          ctx.beginPath();
          ctx.arc(foot.x, foot.y, 2.5 * foot.s, 0, TWO_PI);
          ctx.fill();
          const r = (9 + (isHover ? 3 : 0)) * p.s;
          ctx.fillStyle = `rgb(${acc2})`;
          ctx.shadowColor = `rgb(${acc2})`;
          ctx.shadowBlur = 18;
          ctx.beginPath();
          ctx.arc(p.x, p.y, r, 0, TWO_PI);
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.fillStyle = bg;
          ctx.font = `600 ${Math.round(11 * p.s)}px "Geist Mono", ui-monospace, monospace`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(String(m.count), p.x, p.y + 0.5);
        } else if (m.future) {
          ctx.strokeStyle = muted;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(p.x, p.y, (isHover ? 6 : 4) * p.s, 0, TWO_PI);
          ctx.stroke();
        } else {
          ctx.fillStyle = `rgb(${acc})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, (isHover ? 5 : 3) * p.s, 0, TWO_PI);
          ctx.fill();
        }

        // Le nom du mois, écarté vers l'extérieur de l'orbite
        const out = at((k + 0.5) / 12, m.count > 0 ? BADGE + 0.13 : 1.16);
        const showLabel = !compact || m.count > 0 || isHover || p.z < -0.55;
        if (showLabel) {
          ctx.globalAlpha = a * (m.count > 0 || isHover ? 1 : 0.7);
          ctx.fillStyle = m.count > 0 ? fg : muted;
          ctx.font = `500 ${compact ? 9 : 10}px "Geist Mono", ui-monospace, monospace`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(m.short, out.x, out.y);
        }
      });
      ctx.globalAlpha = 1;
    };

    // La comète "Aujourd'hui" et sa traînée
    const drawComet = () => {
      const head = at(data.progress);
      for (let i = 0; i < 26; i++) {
        const p = at(data.progress - i * 0.0022);
        ctx.globalAlpha = (1 - i / 26) * 0.5;
        ctx.fillStyle = `rgb(${acc2})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, (4.5 - i * 0.14) * p.s, 0, TWO_PI);
        ctx.fill();
      }
      const pulse = (frame % 100) / 100;
      ctx.globalAlpha = 1 - pulse;
      ctx.strokeStyle = `rgb(${acc2})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(head.x, head.y, (6 + pulse * 20) * head.s, 0, TWO_PI);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = `rgb(${acc2})`;
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(head.x, head.y, 5 * head.s, 0, TWO_PI);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Étiquette au-dessus de la comète, côté soleil (l'extérieur est réservé aux mois)
      const ly = head.y - (compact ? 44 : 58);
      ctx.strokeStyle = `rgb(${acc2})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(head.x, head.y - 10);
      ctx.lineTo(head.x, ly + 22);
      ctx.stroke();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = '600 13px "Geist", system-ui, sans-serif';
      ctx.fillStyle = fg;
      ctx.fillText("Aujourd'hui", head.x, ly);
      ctx.font = '500 10px "Geist Mono", ui-monospace, monospace';
      ctx.fillStyle = `rgb(${acc2})`;
      ctx.fillText(data.todayLabel.toUpperCase(), head.x, ly + 14);
    };

    // Bulle d'information du mois survolé
    const drawTooltip = () => {
      if (hovered < 0) return;
      const m = data.months[hovered];
      const p = monthScreen[hovered];
      const line2 =
        m.count > 0
          ? `${m.count} entrée${m.count > 1 ? "s" : ""} · cliquer pour voir`
          : m.future
            ? "À venir"
            : "Rien ce mois-ci";
      ctx.font = '600 13px "Geist", system-ui, sans-serif';
      const w = Math.max(ctx.measureText(m.long).width, ctx.measureText(line2).width * 0.85) + 28;
      const h = 50;
      const x = clamp(p.x - w / 2, 8, W - w - 8),
        y = clamp(p.y - h - 22, 8, H - h - 8);
      ctx.globalAlpha = 0.94;
      ctx.fillStyle = bg;
      ctx.strokeStyle = `rgb(${acc} / 0.6)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 10);
      ctx.fill();
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillStyle = fg;
      ctx.fillText(m.long, x + 14, y + 18);
      ctx.font = '500 10px "Geist Mono", ui-monospace, monospace';
      ctx.fillStyle = m.count > 0 ? `rgb(${acc2})` : muted;
      ctx.fillText(line2.toUpperCase(), x + 14, y + 34);
    };

    // Ordre de dessin = profondeur : l'arrière, le soleil, puis l'avant
    drawPath(false);
    drawMonths(false);
    drawSun();
    drawPath(true);
    drawMonths(true);
    drawComet();
    drawTooltip();
  });
}

/* ------------------------------------------------------------------ */
/* 2. La frise verticale en 3D                                         */
/* ------------------------------------------------------------------ */
/*
 * Pour chaque carte, on calcule d = sa distance au centre de l'écran,
 * de -1 (tout en haut) à +1 (tout en bas), et on la donne au CSS (--d).
 * Le CSS en déduit une rotation : une carte loin du centre est tournée
 * et reculée, elle se redresse face à nous en arrivant au milieu.
 * La ligne verticale se remplit au même rythme que la lecture.
 */
export function mountTimeline(list: HTMLElement) {
  if (!once(list, "timeline")) return;
  const items = [...list.querySelectorAll<HTMLElement>("[data-tl-item]")];
  const fill = list.querySelector<HTMLElement>("[data-tl-fill]");
  const still = reducedMotion();

  const update = throttleFrame(() => {
    const vh = window.innerHeight;
    const r = list.getBoundingClientRect();
    const progress = clamp((vh * 0.6 - r.top) / r.height, 0, 1);
    if (fill) fill.style.transform = `scaleY(${progress})`;
    for (const item of items) {
      const ir = item.getBoundingClientRect();
      const center = ir.top + ir.height / 2;
      const d = clamp((center - vh / 2) / (vh * 0.75), -1, 1);
      if (!still) {
        item.style.setProperty("--d", d.toFixed(3));
        item.style.setProperty("--ad", Math.abs(d).toFixed(3));
      }
      // Le point s'allume quand il passe au niveau où la ligne lumineuse est arrivée
      item.dataset.active = String(ir.top + 44 < vh * 0.6);
    }
  });
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  new ResizeObserver(update).observe(list);
  update();
}

/* ------------------------------------------------------------------ */
/* 3. La barre des mois qui suit la lecture                            */
/* ------------------------------------------------------------------ */
export function mountMonthNav(nav: HTMLElement) {
  if (!once(nav, "monthNav")) return;
  const links = [...nav.querySelectorAll<HTMLAnchorElement>("a[data-month]")];
  const pill = nav.querySelector<HTMLElement>("[data-month-pill]");
  const scroller = nav.querySelector<HTMLElement>("[data-month-scroller]") ?? nav;
  const sections = links
    .map((a) => document.getElementById(a.getAttribute("href")!.slice(1)))
    .filter((s): s is HTMLElement => s !== null);
  let current: HTMLAnchorElement | null = null;

  const setActive = (link: HTMLAnchorElement | null) => {
    if (link === current) return;
    current = link;
    links.forEach((a) => (a === link ? a.setAttribute("aria-current", "true") : a.removeAttribute("aria-current")));
    if (!pill) return;
    if (!link) {
      pill.style.opacity = "0";
      return;
    }
    pill.style.opacity = "1";
    pill.style.width = `${link.offsetWidth}px`;
    pill.style.transform = `translateX(${link.offsetLeft}px)`;
    // Sur mobile la barre défile horizontalement : on garde le mois actif au centre
    scroller.scrollTo({
      left: link.offsetLeft - scroller.clientWidth / 2 + link.offsetWidth / 2,
      behavior: reducedMotion() ? "auto" : "smooth",
    });
  };

  const update = throttleFrame(() => {
    const line = window.innerHeight * 0.45;
    let active: HTMLElement | null = null;
    for (const s of sections) if (s.getBoundingClientRect().top <= line) active = s;
    active ??= sections[0] ?? null;
    setActive(active ? (links.find((a) => a.getAttribute("href") === `#${active!.id}`) ?? null) : null);
  });
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", () => {
    current = null; // force le recalcul de la position de la pilule
    update();
  });
  update();
}
