/**
 * Centralized date/time utilities for Questista.
 *
 * The app's day boundary is the Estonian day (Europe/Tallinn, EET/EEST with
 * automatic DST). Every "what day is it?" decision in the app — today's
 * question, calendar, streaks, daily-return reset — MUST go through here.
 * Computing "today" with `new Date().toISOString().slice(0,10)` gives the UTC
 * date, which is wrong for this audience and drifts 2–3 hours from the local
 * midnight users actually experience.
 *
 * All functions are deterministic given an instant and are DST-correct via the
 * Intl API (no timezone database or external dep required).
 */

export const APP_TIMEZONE = "Europe/Tallinn";

const PARTS_FMT = new Intl.DateTimeFormat("en-CA", {
  timeZone: APP_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/**
 * The YYYY-MM-DD calendar date of `instant` in the app timezone.
 * `en-CA` yields ISO-style order, so the output is already `YYYY-MM-DD`.
 */
export function dateKeyAt(instant: Date = new Date()): string {
  return PARTS_FMT.format(instant);
}

/** Today's date key (YYYY-MM-DD) in the app timezone. */
export function todayKey(): string {
  return dateKeyAt(new Date());
}

/** ISO timestamp for "now" (stored on rows with timestamptz). */
export function nowISO(): string {
  return new Date().toISOString();
}

/** Parse a YYYY-MM-DD key into a UTC Date at 00:00:00Z (for date math only). */
function keyToDate(key: string): Date {
  return new Date(`${key}T00:00:00.000Z`);
}

/**
 * Add `days` (may be negative) to a YYYY-MM-DD key, returning a new key.
 * Math is done on the calendar key directly so no timezone shift creeps in.
 */
export function addDaysKey(key: string, days: number): string {
  const d = keyToDate(key);
  d.setUTCDate(d.getUTCDate() + days);
  return dateKeyAt(d);
}

/** True if `key` is today in the app timezone. */
export function isToday(key: string): boolean {
  return key === todayKey();
}

/**
 * The "effective today" for serving a question: if the current app-time is
 * before 00:00, that's still today; this helper just returns todayKey() but is
 * kept as a named seam so future logic (e.g. late-night rollover windows) can
 * change in one place.
 */
export function effectiveQuestionDay(): string {
  return todayKey();
}