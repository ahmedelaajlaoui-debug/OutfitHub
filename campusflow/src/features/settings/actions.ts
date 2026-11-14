"use server";

import { refresh } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { localeSchema, profileSchema, type ProfileInput } from "./schemas";

export type SettingsActionResult = { ok: true } | { ok: false; error: "unauthenticated" | "invalidInput" | "saveFailed" };

export async function updateProfileAction(input: ProfileInput): Promise<SettingsActionResult> {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalidInput" };

  const [user, supabase] = await Promise.all([getCurrentUser(), createSupabaseServerClient()]);
  if (!user || !supabase) return { ok: false, error: "unauthenticated" };

  const { fullName, university, fieldOfStudy, academicLevel } = parsed.data;
  // RLS + column privileges ensure only the caller's own editable columns change.
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName, university, field_of_study: fieldOfStudy, academic_level: academicLevel })
    .eq("id", user.id);

  if (error) return { ok: false, error: "saveFailed" };
  refresh();
  return { ok: true };
}

export async function updateLocaleAction(locale: string): Promise<SettingsActionResult> {
  const parsed = localeSchema.safeParse(locale);
  if (!parsed.success) return { ok: false, error: "invalidInput" };

  const [user, supabase] = await Promise.all([getCurrentUser(), createSupabaseServerClient()]);
  if (!user || !supabase) return { ok: false, error: "unauthenticated" };

  const { error } = await supabase.from("profiles").update({ locale: parsed.data }).eq("id", user.id);
  return error ? { ok: false, error: "saveFailed" } : { ok: true };
}
