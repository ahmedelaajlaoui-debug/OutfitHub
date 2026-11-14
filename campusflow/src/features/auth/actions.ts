"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { localizedPath, safeRedirectPath } from "@/lib/routes";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mapAuthError, type AuthErrorKey } from "./errors";
import { loginSchema, registerSchema, type LoginInput, type RegisterInput } from "./schemas";

export type AuthActionResult =
  | { status: "error"; error: AuthErrorKey | "notConfigured" | "invalidInput" }
  | { status: "confirm-email"; email: string };

function resolveLocale(value: unknown): Locale {
  return isLocale(value) ? value : "fr";
}

async function getSiteUrl(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const protocol = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}

export async function signInAction(
  input: LoginInput,
  localeInput: string,
  next?: string | null,
): Promise<AuthActionResult> {
  const locale = resolveLocale(localeInput);
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { status: "error", error: "invalidInput" };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { status: "error", error: "notConfigured" };

  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { status: "error", error: mapAuthError(error) };

  redirect(safeRedirectPath(next, locale));
}

export async function signUpAction(input: RegisterInput, localeInput: string): Promise<AuthActionResult> {
  const locale = resolveLocale(localeInput);
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) return { status: "error", error: "invalidInput" };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { status: "error", error: "notConfigured" };

  const { fullName, email, password, university, fieldOfStudy, academicLevel } = parsed.data;
  const siteUrl = await getSiteUrl();
  const next = localizedPath(locale, "/dashboard");

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl}/auth/confirm?next=${encodeURIComponent(next)}`,
      // Read by the handle_new_user() trigger, which validates every field.
      data: {
        full_name: fullName,
        university: university ?? null,
        field_of_study: fieldOfStudy ?? null,
        academic_level: academicLevel ?? null,
        locale,
      },
    },
  });

  if (error) return { status: "error", error: mapAuthError(error) };

  // With email confirmation enabled Supabase returns no session. For an address
  // that is already registered it returns the same response on purpose, so we
  // show the same "check your email" screen and do not reveal which emails exist.
  if (!data.session) return { status: "confirm-email", email };

  redirect(next);
}

export async function signOutAction(formData: FormData): Promise<void> {
  const locale = resolveLocale(formData.get("locale"));
  const supabase = await createSupabaseServerClient();
  if (supabase) {
    await supabase.auth.signOut({ scope: "local" });
  }
  redirect(localizedPath(locale, "/login"));
}
