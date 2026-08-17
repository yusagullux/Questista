export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const RTF = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

export function timeAgo(dateStr: string) {
  const date = new Date(dateStr);
  const diff = (date.getTime() - Date.now()) / 1000;
  const abs = Math.abs(diff);
  const ranges: [number, Intl.RelativeTimeFormatUnit][] = [
    [60, "second"],
    [3600, "minute"],
    [86400, "hour"],
    [604800, "day"],
    [2629800, "week"],
    [31557600, "month"],
    [Infinity, "year"],
  ];
  for (let i = 0; i < ranges.length; i++) {
    const [limit, unit] = ranges[i];
    if (abs < limit) {
      const divisor = i === 0 ? 1 : ranges[i - 1][0];
      return RTF.format(-Math.round(diff / divisor), unit);
    }
  }
  return RTF.format(-Math.round(diff / 31557600), "year");
}

export function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/* Almanac masthead date: "MON 17 AUG 2026" — the mono voice of the
   dated masthead and stamp tiles. App-timezone-aware (Europe/Tallinn). */
export function almanacDate(dateStr: string | Date): string {
  const d = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  return d
    .toLocaleDateString("en-GB", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "Europe/Tallinn",
    })
    .toUpperCase()
    .replace(/,/g, "");
}

/* Day-of-year edition number — deterministic, no new data needed.
   The "front page" reads "NO. 229" for the 229th day of the year. */
export function editionNumber(dateStr: string | Date): number {
  const d = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  const start = Date.UTC(d.getUTCFullYear(), 0, 0);
  const diff = d.getTime() - start;
  return Math.floor(diff / 86_400_000);
}

export function shortDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function dateKey(date: Date) {
  return date.toISOString().slice(0, 10); // YYYY-MM-DD
}

export function initials(name: string | null | undefined) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
}