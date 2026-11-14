import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DashboardSkeleton, DashboardView } from "@/features/dashboard/dashboard-view";
import { getDashboardData } from "@/features/dashboard/queries";
import { DEFAULT_TIME_ZONE, isValidTimeZone } from "@/lib/academic/time";
import { requireUser } from "@/lib/auth/session";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

export async function generateMetadata({ params }: PageProps<"/[locale]/dashboard">): Promise<Metadata> {
  const { locale } = await params;
  return isLocale(locale) ? { title: getDictionary(locale).nav.dashboard } : {};
}

async function Dashboard({ locale }: { locale: Locale }) {
  const { user, supabase } = await requireUser(locale);
  const t = getDictionary(locale);
  const profileZone = user.profile?.timezone;
  const timeZone = profileZone && isValidTimeZone(profileZone) ? profileZone : DEFAULT_TIME_ZONE;
  // Request-time clock: read after the session so this never runs during prerendering.
  const now = new Date();
  const result = await getDashboardData(supabase, { timeZone, now });

  return (
    <DashboardView
      locale={locale}
      t={t}
      name={user.profile?.full_name ?? user.email ?? ""}
      profile={user.profile}
      result={result}
      now={now}
      timeZone={timeZone}
    />
  );
}

export default async function DashboardPage({ params }: PageProps<"/[locale]/dashboard">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Dashboard locale={locale} />
    </Suspense>
  );
}
