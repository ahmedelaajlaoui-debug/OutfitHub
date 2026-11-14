import { defaultLocale, isLocale, type Locale } from "./i18n/config";

/** Paths (without locale prefix) that require a signed-in user. */
export const PROTECTED_PATHS = ["/dashboard", "/settings"] as const;

/** Auth pages that signed-in users should skip. */
export const AUTH_PATHS = ["/login", "/register"] as const;

export const DEFAULT_AUTHENTICATED_PATH = "/dashboard";

function matches(path: string, prefixes: readonly string[]): boolean {
  return prefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

export function isProtectedPath(pathWithoutLocale: string): boolean {
  return matches(pathWithoutLocale, PROTECTED_PATHS);
}

export function isAuthPath(pathWithoutLocale: string): boolean {
  return matches(pathWithoutLocale, AUTH_PATHS);
}

export function localizedPath(locale: Locale, path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return normalized === "/" ? `/${locale}` : `/${locale}${normalized}`;
}

/** Splits "/fr/dashboard" into { locale: "fr", path: "/dashboard" }. */
export function splitLocale(pathname: string): { locale: Locale | null; path: string } {
  const [, first = "", ...rest] = pathname.split("/");
  if (isLocale(first)) {
    return { locale: first, path: `/${rest.join("/")}`.replace(/\/+$/, "") || "/" };
  }
  return { locale: null, path: pathname || "/" };
}

/**
 * Validates a post-login redirect target to prevent open redirects.
 * Only same-origin, locale-prefixed application paths are accepted.
 */
export function safeRedirectPath(candidate: string | null | undefined, locale: Locale = defaultLocale): string {
  const fallback = localizedPath(locale, DEFAULT_AUTHENTICATED_PATH);
  if (!candidate || typeof candidate !== "string") return fallback;
  if (!candidate.startsWith("/") || candidate.startsWith("//") || candidate.includes("\\")) return fallback;
  if (/[\u0000-\u001f]/.test(candidate)) return fallback;

  let url: URL;
  try {
    url = new URL(candidate, "http://campusflow.local");
  } catch {
    return fallback;
  }
  if (url.origin !== "http://campusflow.local") return fallback;

  const { locale: targetLocale, path } = splitLocale(url.pathname);
  if (!targetLocale || isAuthPath(path)) return fallback;
  return `${url.pathname}${url.search}`;
}
