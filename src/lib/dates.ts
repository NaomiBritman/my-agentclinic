/** This computer's current local date, as YYYY-MM-DD. Only the server calls it. */
export function localDate(now: Date = new Date()): string {
  const year = String(now.getFullYear()).padStart(4, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Formats a stored YYYY-MM-DD date for reading, such as on the history page. */
export function formatDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("en", { dateStyle: "full" }).format(
    new Date(year, month - 1, day),
  );
}
