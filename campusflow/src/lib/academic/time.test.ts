import { describe, expect, it } from "vitest";
import { getTimeZoneOffset, getZonedDayRange, getZonedHour, isValidTimeZone } from "./time";

describe("time-zone helpers", () => {
  it("computes the local day in a UTC+1 zone", () => {
    // Etc/GMT-1 is a fixed UTC+1 zone; 23:30 UTC is already 00:30 the next day.
    const { start, end } = getZonedDayRange(new Date("2026-11-14T23:30:00Z"), "Etc/GMT-1");
    expect(start.toISOString()).toBe("2026-11-14T23:00:00.000Z");
    expect(end.toISOString()).toBe("2026-11-15T23:00:00.000Z");
  });

  it("follows the runtime tz database for Casablanca instead of a hard-coded offset", () => {
    const now = new Date("2026-11-14T12:00:00Z");
    const { start, end } = getZonedDayRange(now, "Africa/Casablanca");
    expect(start.getTime()).toBeLessThanOrEqual(now.getTime());
    expect(end.getTime()).toBeGreaterThan(now.getTime());
    expect(getZonedHour(start, "Africa/Casablanca")).toBe(0);
  });

  it("handles days containing a DST change", () => {
    // Europe/Paris switches to summer time on 2026-03-29: the day lasts 23 hours.
    const { start, end } = getZonedDayRange(new Date("2026-03-29T12:00:00Z"), "Europe/Paris");
    expect(start.toISOString()).toBe("2026-03-28T23:00:00.000Z");
    expect(end.toISOString()).toBe("2026-03-29T22:00:00.000Z");
    expect(end.getTime() - start.getTime()).toBe(23 * 60 * 60 * 1000);
  });

  it("returns offsets and local hours", () => {
    expect(getTimeZoneOffset(new Date("2026-01-10T12:00:00Z"), "UTC")).toBe(0);
    expect(getZonedHour(new Date("2026-01-10T12:00:00Z"), "Etc/GMT-1")).toBe(13);
  });

  it("validates IANA zones", () => {
    expect(isValidTimeZone("Africa/Casablanca")).toBe(true);
    expect(isValidTimeZone("Mars/Olympus")).toBe(false);
  });
});
