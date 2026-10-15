/**
 * Jauge circulaire de l'année scolaire : 12 arcs, un par mois.
 * Les mois passés sont pleins, le mois en cours brille, les suivants sont vides.
 * C'est du SVG pur : chaque arc est un <path> calculé avec un peu de trigonométrie.
 */
import type { CSSProperties } from "react";
import { schoolYear } from "@/lib/year";

const SIZE = 260;
const C = SIZE / 2;
const R = 100;

/** Point du cercle de rayon r à l'angle `deg` (0° = en haut, sens des aiguilles d'une montre). */
function polar(r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return [C + r * Math.cos(rad), C + r * Math.sin(rad)] as const;
}

/** Chemin SVG d'un arc de cercle entre deux angles. */
function arc(r: number, from: number, to: number) {
  const [x1, y1] = polar(r, from);
  const [x2, y2] = polar(r, to);
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

export function YearGauge() {
  const year = schoolYear();
  const current = year.months[year.currentIndex];
  const [cx, cy] = polar(R + 18, year.progress * 360);

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[260px]">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="size-full" aria-hidden>
        {/* Anneau extérieur en pointillés qui tourne lentement */}
        <g className="origin-center animate-[spin_60s_linear_infinite]">
          <circle cx={C} cy={C} r={R + 18} fill="none" stroke="var(--border)" strokeDasharray="2 6" />
        </g>
        {year.months.map((m, k) => (
          <path
            key={m.key}
            d={arc(R, k * 30 + 3, k * 30 + 27)}
            fill="none"
            strokeWidth={10}
            strokeLinecap="round"
            stroke={
              m.current
                ? "var(--accent-2)"
                : m.past
                  ? "var(--accent)"
                  : "color-mix(in oklab, var(--muted) 28%, transparent)"
            }
            className={m.current ? "animate-pulse" : undefined}
            style={m.current ? ({ filter: "drop-shadow(0 0 6px var(--accent-2))" } as CSSProperties) : undefined}
          />
        ))}
        {/* "Aujourd'hui" : un point sur l'anneau extérieur, à la fraction de l'année écoulée */}
        <circle
          cx={cx}
          cy={cy}
          r={4}
          fill="var(--accent-2)"
          style={{ filter: "drop-shadow(0 0 6px var(--accent-2))" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <p className="font-display text-5xl tabular-nums">
          {String(year.currentIndex + 1).padStart(2, "0")}
          <span className="text-2xl text-muted">/12</span>
        </p>
        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">mois · {current.name}</p>
        <p className="mt-2 font-mono text-[11px] text-cyan">{Math.round(year.progress * 100)} % de l&apos;année</p>
      </div>
    </div>
  );
}
