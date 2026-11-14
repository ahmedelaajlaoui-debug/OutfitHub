"use client";

import { createContext, useContext, type ReactNode } from "react";
import { getDirection, type Locale } from "./config";
import type { Dictionary } from "./dictionaries";

type I18nContextValue = {
  locale: Locale;
  dir: "ltr" | "rtl";
  t: Dictionary;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  locale,
  dictionary,
  children,
}: {
  locale: Locale;
  dictionary: Dictionary;
  children: ReactNode;
}) {
  return (
    <I18nContext value={{ locale, dir: getDirection(locale), t: dictionary }}>{children}</I18nContext>
  );
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used inside <I18nProvider>.");
  }
  return context;
}
