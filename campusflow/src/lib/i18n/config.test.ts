import { describe, expect, it } from "vitest";
import { getDirection, isLocale, negotiateLocale } from "./config";

describe("locale config", () => {
  it("recognises supported locales only", () => {
    expect(isLocale("fr")).toBe(true);
    expect(isLocale("ar")).toBe(true);
    expect(isLocale("en")).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });

  it("uses RTL for Arabic", () => {
    expect(getDirection("ar")).toBe("rtl");
    expect(getDirection("fr")).toBe("ltr");
  });

  it.each([
    [null, "fr"],
    ["", "fr"],
    ["ar-MA,ar;q=0.9,fr;q=0.8", "ar"],
    ["en-US,en;q=0.9,ar;q=0.5,fr;q=0.7", "fr"],
    ["en-US,en;q=0.9", "fr"],
    ["fr;q=0, ar;q=0.2", "ar"],
    ["de, ar-MA;q=0.4", "ar"],
  ])("negotiates %s -> %s", (header, expected) => {
    expect(negotiateLocale(header)).toBe(expected);
  });
});
