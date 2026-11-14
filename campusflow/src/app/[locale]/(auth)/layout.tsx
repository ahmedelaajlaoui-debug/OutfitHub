import { CircleCheck } from "lucide-react";
import { notFound } from "next/navigation";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { Logo, LogoMark } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { localizedPath } from "@/lib/routes";

export default async function AuthLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const points = [t.auth.brand.points.one, t.auth.brand.points.two, t.auth.brand.points.three];

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_minmax(0,480px)] xl:grid-cols-[1fr_minmax(0,560px)]">
      <div className="flex flex-col">
        <header className="flex h-16 items-center justify-between px-4 sm:px-8">
          <Logo href={localizedPath(locale, "/")} />
          <div className="flex items-center gap-1">
            <LocaleSwitcher />
            <ThemeToggle />
          </div>
        </header>
        <main id="main" className="flex flex-1 items-start justify-center px-4 py-8 sm:items-center sm:px-8">
          <div className="w-full max-w-md">{children}</div>
        </main>
      </div>
      <aside className="relative hidden overflow-hidden border-s border-border bg-panel text-panel-foreground lg:flex lg:flex-col lg:justify-between lg:p-12">
        <LogoMark className="size-10" />
        <div>
          <p className="text-3xl leading-tight font-semibold tracking-tight text-balance">{t.auth.brand.title}</p>
          <ul className="mt-8 space-y-4">
            {points.map((point) => (
              <li key={point} className="flex items-center gap-3 text-sm opacity-85">
                <CircleCheck className="size-5 shrink-0 text-primary-hover" aria-hidden />
                {point}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs opacity-60">{t.landing.footer.tagline}</p>
      </aside>
    </div>
  );
}
