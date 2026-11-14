export const locales = ["fr", "ar"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "fr";

/** Cookie that remembers the visitor's last chosen language. */
export const LOCALE_COOKIE = "NEXT_LOCALE";

export const localeLabels: Record<Locale, string> = {
  fr: "Français",
  ar: "العربية",
};

/** BCP 47 tags used for Intl date/number formatting (Moroccan conventions). */
export const intlLocales: Record<Locale, string> = {
  fr: "fr-MA",
  ar: "ar-MA",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}

export function getDirection(locale: Locale): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr";
}

/**
 * Picks the best supported locale from an Accept-Language header.
 * Only the primary language subtag is compared ("ar-MA" -> "ar").
 */
export function negotiateLocale(acceptLanguage: string | null | undefined): Locale {
  if (!acceptLanguage) return defaultLocale;

  const ranked = acceptLanguage
    .split(",")
    .map((part, index) => {
      const [tag, ...params] = part.trim().split(";");
      const qParam = params.find((p) => p.trim().startsWith("q="));
      const q = qParam ? Number.parseFloat(qParam.trim().slice(2)) : 1;
      return {
        language: tag.trim().toLowerCase().split("-")[0],
        q: Number.isFinite(q) ? q : 0,
        index,
      };
    })
    .filter((entry) => entry.language && entry.q > 0)
    .sort((a, b) => b.q - a.q || a.index - b.index);

  for (const entry of ranked) {
    if (isLocale(entry.language)) return entry.language;
  }
  return defaultLocale;
}
