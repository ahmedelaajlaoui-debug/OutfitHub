import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { ButtonLink } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { localizedPath } from "@/lib/routes";

export function SiteHeader({ locale, t }: { locale: Locale; t: Dictionary }) {
  const links = [
    { href: "#features", label: t.landing.nav.features },
    { href: "#how-it-works", label: t.landing.nav.howItWorks },
    { href: "#security", label: t.landing.nav.security },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo href={localizedPath(locale, "/")} />
        <nav aria-label={t.nav.main} className="hidden md:block">
          <ul className="flex items-center gap-1">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-1 sm:gap-2">
          <LocaleSwitcher className="hidden sm:inline-flex" />
          <ThemeToggle />
          <ButtonLink href={localizedPath(locale, "/login")} variant="ghost" size="sm" className="hidden sm:inline-flex">
            {t.landing.nav.login}
          </ButtonLink>
          <ButtonLink href={localizedPath(locale, "/register")} size="sm">
            {t.landing.nav.register}
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}
