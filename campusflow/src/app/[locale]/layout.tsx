import "@fontsource-variable/inter";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "@fontsource/ibm-plex-sans-arabic/700.css";
import "../globals.css";

import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { getDirection, isLocale, locales } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { I18nProvider } from "@/lib/i18n/provider";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  return {
    metadataBase: siteUrl ? new URL(siteUrl) : undefined,
    title: { default: t.meta.title, template: `%s · ${t.common.appName}` },
    description: t.meta.description,
    applicationName: t.common.appName,
    alternates: { languages: { fr: "/fr", ar: "/ar" } },
    openGraph: { title: t.meta.title, description: t.meta.description, locale: locale === "ar" ? "ar_MA" : "fr_MA", type: "website" },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F8FAFC" },
    { media: "(prefers-color-scheme: dark)", color: "#0B1120" },
  ],
};

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dictionary = getDictionary(locale);

  return (
    <html lang={locale} dir={getDirection(locale)} suppressHydrationWarning>
      <body className="min-h-dvh">
        <a
          href="#main"
          className="sr-only z-50 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground focus:not-sr-only focus:fixed focus:start-4 focus:top-4"
        >
          {dictionary.common.skipToContent}
        </a>
        <ThemeProvider>
          <I18nProvider locale={locale} dictionary={dictionary}>
            {children}
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
