import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AuthFormSkeleton, AuthHeading } from "@/components/layout/auth-card";
import { LoginForm } from "@/features/auth/login-form";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export async function generateMetadata({ params }: PageProps<"/[locale]/login">): Promise<Metadata> {
  const { locale } = await params;
  return isLocale(locale) ? { title: getDictionary(locale).auth.login.submit } : {};
}

export default async function LoginPage({ params }: PageProps<"/[locale]/login">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);

  return (
    <>
      <AuthHeading title={t.auth.login.title} subtitle={t.auth.login.subtitle} />
      {/* The form reads ?next= and ?error= from the URL at request time. */}
      <Suspense fallback={<AuthFormSkeleton />}>
        <LoginForm configured={isSupabaseConfigured()} />
      </Suspense>
    </>
  );
}
