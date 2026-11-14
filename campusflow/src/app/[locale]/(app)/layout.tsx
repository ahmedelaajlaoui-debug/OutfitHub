import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { Logo } from "@/components/layout/logo";
import { MobileNav } from "@/components/layout/mobile-nav";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { TopbarUser } from "@/components/layout/topbar-user";
import { Skeleton } from "@/components/ui/skeleton";
import { isLocale } from "@/lib/i18n/config";
import { localizedPath } from "@/lib/routes";

/**
 * Protected application shell. The proxy redirects anonymous visitors, and
 * every page verifies the session again on the server (requireUser).
 * Session-dependent UI streams in behind Suspense boundaries.
 */
export default async function AppLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const home = localizedPath(locale, "/dashboard");

  return (
    <div className="flex min-h-dvh">
      <AppSidebar homeHref={home} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-2 border-b border-border bg-surface/90 px-3 backdrop-blur sm:px-6">
          <MobileNav />
          <Logo href={home} className="lg:hidden" />
          <div className="ms-auto flex items-center gap-1">
            <LocaleSwitcher className="hidden sm:inline-flex" />
            <ThemeToggle />
            <Suspense fallback={<Skeleton className="ms-1 size-8 rounded-full" />}>
              <TopbarUser locale={locale} />
            </Suspense>
          </div>
        </header>
        <main id="main" className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
