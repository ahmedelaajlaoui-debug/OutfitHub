import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LogoutButton } from "@/features/auth/logout-button";
import { LanguageSetting, ThemeSetting } from "@/features/settings/preferences";
import { ProfileForm } from "@/features/settings/profile-form";
import { requireUser } from "@/lib/auth/session";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

export async function generateMetadata({ params }: PageProps<"/[locale]/settings">): Promise<Metadata> {
  const { locale } = await params;
  return isLocale(locale) ? { title: getDictionary(locale).settings.title } : {};
}

async function ProfileSection({ locale }: { locale: Locale }) {
  const { user } = await requireUser(locale);
  const t = getDictionary(locale);
  if (!user.profile) return <Alert variant="warning">{t.dashboard.errors.dbNotReady}</Alert>;

  return (
    <ProfileForm
      email={user.email}
      defaultValues={{
        fullName: user.profile.full_name,
        university: user.profile.university ?? "",
        fieldOfStudy: user.profile.field_of_study ?? "",
        academicLevel: user.profile.academic_level ?? "",
      }}
    />
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-5" aria-hidden>
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-10" />
        </div>
      ))}
    </div>
  );
}

export default async function SettingsPage({ params }: PageProps<"/[locale]/settings">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);

  return (
    <div className="space-y-6">
      <PageHeader title={t.settings.title} description={t.settings.subtitle} />
      <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,380px)]">
        <Card>
          <CardHeader className="block">
            <CardTitle>{t.settings.profile.title}</CardTitle>
            <CardDescription>{t.settings.profile.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<ProfileSkeleton />}>
              <ProfileSection locale={locale} />
            </Suspense>
          </CardContent>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader className="block">
              <CardTitle>{t.settings.preferences.title}</CardTitle>
              <CardDescription>{t.settings.preferences.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <LanguageSetting />
              <ThemeSetting />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="block">
              <CardTitle>{t.settings.account.title}</CardTitle>
              <CardDescription>{t.settings.account.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <LogoutButton className="w-auto border border-danger/30" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
