/**
 * L'année scolaire va de septembre à août. Ces calculs servent à la timeline
 * et à la jauge de l'accueil.
 * Tout est calculé à l'heure de Paris, pour ne pas changer de jour à minuit UTC.
 */
const isoFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Paris",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const shortMonth = new Intl.DateTimeFormat("fr-FR", { month: "short", timeZone: "UTC" });
const longMonth = new Intl.DateTimeFormat("fr-FR", { month: "long", timeZone: "UTC" });

export interface SchoolMonth {
  /** "2026-10" */
  key: string;
  /** "oct." */
  short: string;
  /** "octobre" */
  name: string;
  /** "Octobre 2026" */
  long: string;
  past: boolean;
  current: boolean;
  future: boolean;
}

export function schoolYear(today = new Date()) {
  const todayIso = isoFormatter.format(today); // "2026-10-15"
  const [y, m, d] = todayIso.split("-").map(Number);
  const startYear = m >= 9 ? y : y - 1;
  const start = Date.UTC(startYear, 8, 1); // le mois 8 = septembre (janvier = 0)
  const end = Date.UTC(startYear + 1, 8, 1);
  const now = Date.UTC(y, m - 1, d, 12);
  const currentIndex = (m - 9 + 12) % 12; // septembre = 0, octobre = 1…

  const months: SchoolMonth[] = Array.from({ length: 12 }, (_, k) => {
    const date = new Date(Date.UTC(startYear, 8 + k, 15)); // Date gère le passage à l'année suivante
    const name = longMonth.format(date);
    return {
      key: date.toISOString().slice(0, 7),
      short: shortMonth.format(date),
      name,
      long: `${name.charAt(0).toUpperCase()}${name.slice(1)} ${date.getUTCFullYear()}`,
      past: k < currentIndex,
      current: k === currentIndex,
      future: k > currentIndex,
    };
  });

  return {
    label: `${startYear}-${String(startYear + 1).slice(2)}`, // "2026-27"
    todayIso,
    /** Fraction de l'année déjà écoulée, entre 0 et 1 */
    progress: (now - start) / (end - start),
    currentIndex,
    months,
  };
}
