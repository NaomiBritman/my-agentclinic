/** This computer's current local date, as YYYY-MM-DD. Only the server calls it. */
export function localDate(now: Date = new Date()): string {
  const year = String(now.getFullYear()).padStart(4, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dayCount(date: string): number {
  const [year, month, day] = date.split("-").map(Number);
  return Date.UTC(year, month - 1, day) / 86_400_000;
}

/** The whole days from one YYYY-MM-DD date to another. */
export function daysBetween(from: string, to: string): number {
  return dayCount(to) - dayCount(from);
}

/** The YYYY-MM-DD date a number of days after another. */
export function addDays(date: string, days: number): string {
  return new Date((dayCount(date) + days) * 86_400_000).toISOString().slice(0, 10);
}

/** Formats a stored YYYY-MM-DD date for reading, such as on the history page. */
export function formatDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("en", { dateStyle: "full" }).format(
    new Date(year, month - 1, day),
  );
}
