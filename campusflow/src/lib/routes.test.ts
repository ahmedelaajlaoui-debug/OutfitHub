import { describe, expect, it } from "vitest";
import { isAuthPath, isProtectedPath, localizedPath, safeRedirectPath, splitLocale } from "./routes";

describe("route helpers", () => {
  it("builds localized paths", () => {
    expect(localizedPath("fr", "/")).toBe("/fr");
    expect(localizedPath("ar", "/dashboard")).toBe("/ar/dashboard");
    expect(localizedPath("ar", "settings")).toBe("/ar/settings");
  });

  it("splits the locale prefix", () => {
    expect(splitLocale("/fr/dashboard")).toEqual({ locale: "fr", path: "/dashboard" });
    expect(splitLocale("/ar")).toEqual({ locale: "ar", path: "/" });
    expect(splitLocale("/ar/")).toEqual({ locale: "ar", path: "/" });
    expect(splitLocale("/dashboard")).toEqual({ locale: null, path: "/dashboard" });
  });

  it("classifies protected and auth paths without prefix collisions", () => {
    expect(isProtectedPath("/dashboard")).toBe(true);
    expect(isProtectedPath("/settings/profile")).toBe(true);
    expect(isProtectedPath("/dashboards")).toBe(false);
    expect(isProtectedPath("/")).toBe(false);
    expect(isAuthPath("/login")).toBe(true);
    expect(isAuthPath("/register")).toBe(true);
    expect(isAuthPath("/loginx")).toBe(false);
  });

  describe("safeRedirectPath", () => {
    it("accepts same-origin localized app paths", () => {
      expect(safeRedirectPath("/fr/settings", "fr")).toBe("/fr/settings");
      expect(safeRedirectPath("/ar/dashboard?tab=1", "fr")).toBe("/ar/dashboard?tab=1");
    });

    it.each([
      null,
      "",
      "https://evil.example/fr/dashboard",
      "//evil.example/fr/dashboard",
      "/\\evil.example",
      "javascript:alert(1)",
      "/en/dashboard",
      "/fr/login",
      "/fr/\u0000",
      "/fr/\r\nSet-Cookie:x",
    ])("rejects %s", (candidate) => {
      expect(safeRedirectPath(candidate, "ar")).toBe("/ar/dashboard");
    });
  });
});
