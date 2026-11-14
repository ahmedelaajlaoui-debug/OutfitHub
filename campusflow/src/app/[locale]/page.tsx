import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/landing/site-header";
import { Features, FinalCta, Hero, Security, SiteFooter, Steps } from "@/components/landing/sections";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

export default async function LandingPage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);

  return (
    <>
      <SiteHeader locale={locale} t={t} />
      <main id="main">
        <Hero locale={locale} t={t} />
        <Features t={t} />
        <Steps t={t} />
        <Security t={t} />
        <FinalCta locale={locale} t={t} />
      </main>
      <SiteFooter locale={locale} t={t} />
    </>
  );
}
