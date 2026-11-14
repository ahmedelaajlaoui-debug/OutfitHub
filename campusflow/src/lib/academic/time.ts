/**
 * Time-zone helpers built on Intl only (no date library).
 * Default zone is Africa/Casablanca, which has irregular offset changes
 * (e.g. during Ramadan), so offsets are always computed, never hard-coded.
 */

export const DEFAULT_TIME_ZONE = "Africa/Casablanca";

type ZonedParts = { year: number; month: number; day: number; hour: number; minute: number; second: number };

function getZonedParts(date: Date, timeZone: string): ZonedParts {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = Object.fromEntries(
    formatter.formatToParts(date).map((part) => [part.type, part.value]),
  ) as Record<string, string>;
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

/** Offset of `timeZone` from UTC at `date`, in milliseconds. */
export function getTimeZoneOffset(date: Date, timeZone: string): number {
  const p = getZonedParts(date, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/** UTC instant of a wall-clock time in `timeZone`. */
export function zonedTimeToUtc(
  year: number,
  month: number,
  day: number,
  timeZone: string,
  hour = 0,
  minute = 0,
): Date {
  const guess = Date.UTC(year, month - 1, day, hour, minute);
  const firstPass = guess - getTimeZoneOffset(new Date(guess), timeZone);
  // Second pass corrects for an offset change between the guess and the result.
  return new Date(guess - getTimeZoneOffset(new Date(firstPass), timeZone));
}

/** Start (inclusive) and end (exclusive) of the calendar day containing `now` in `timeZone`. */
export function getZonedDayRange(now: Date, timeZone: string = DEFAULT_TIME_ZONE): { start: Date; end: Date } {
  const { year, month, day } = getZonedParts(now, timeZone);
  const start = zonedTimeToUtc(year, month, day, timeZone);
  const next = new Date(Date.UTC(year, month - 1, day + 1));
  const end = zonedTimeToUtc(next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate(), timeZone);
  return { start, end };
}

export function getZonedHour(now: Date, timeZone: string = DEFAULT_TIME_ZONE): number {
  return getZonedParts(now, timeZone).hour;
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}
