/** Formatage des dates en français, toujours en heure de Paris. */
const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/Paris",
});
const monthFormatter = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: "Europe/Paris" });

/** "2026-10-15" ou un ISO complet -> "15 octobre 2026" */
export function formatDate(value: string | null | undefined) {
  if (!value) return "";
  // Une date seule ("2026-10-15") est lue à midi pour éviter tout décalage de jour.
  const date = value.length === 10 ? new Date(`${value}T12:00:00Z`) : new Date(value);
  return dateFormatter.format(date);
}

/** "2026-10-15" -> "Octobre 2026" */
export function formatMonth(value: string) {
  const label = monthFormatter.format(new Date(`${value.slice(0, 7)}-15T12:00:00Z`));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** "Ugo", "Tim", "Marcelo" -> "Ugo, Tim et Marcelo" */
export function joinNames(names: string[]) {
  return new Intl.ListFormat("fr-FR", { style: "long", type: "conjunction" }).format(names);
}
