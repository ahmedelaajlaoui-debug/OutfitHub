import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AuthHeading } from "@/components/layout/auth-card";
import { RegisterForm } from "@/features/auth/register-form";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export async function generateMetadata({ params }: PageProps<"/[locale]/register">): Promise<Metadata> {
  const { locale } = await params;
  return isLocale(locale) ? { title: getDictionary(locale).auth.register.title } : {};
}

export default async function RegisterPage({ params }: PageProps<"/[locale]/register">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);

  return (
    <>
      <AuthHeading title={t.auth.register.title} subtitle={t.auth.register.subtitle} />
      <RegisterForm configured={isSupabaseConfigured()} />
    </>
  );
}
