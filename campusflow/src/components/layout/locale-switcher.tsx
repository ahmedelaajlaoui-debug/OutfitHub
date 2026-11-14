"use client";

import { Languages } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { buttonClasses } from "@/components/ui/button";
import { localeLabels, locales, type Locale } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/provider";
import { localizedPath, splitLocale } from "@/lib/routes";

export function switchLocalePath(pathname: string, target: Locale): string {
  return localizedPath(target, splitLocale(pathname).path);
}

/** Links to the same page in the other language. */
export function LocaleSwitcher({ className }: { className?: string }) {
  const { locale, t } = useI18n();
  const pathname = usePathname();
  const target = locales.find((l) => l !== locale) ?? locale;

  return (
    <Link
      href={switchLocalePath(pathname, target)}
      hrefLang={target}
      lang={target}
      aria-label={`${t.common.language}: ${localeLabels[target]}`}
      className={buttonClasses("ghost", "sm", className)}
    >
      <Languages className="size-4" aria-hidden />
      <span>{localeLabels[target]}</span>
    </Link>
  );
}
