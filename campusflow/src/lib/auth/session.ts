import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";
import { localizedPath } from "@/lib/routes";
import type { Locale } from "@/lib/i18n/config";
import { createSupabaseServerClient, type SupabaseServerClient } from "@/lib/supabase/server";
import type { ProfileRow } from "@/types/database";

export type CurrentUser = {
  id: string;
  email: string | null;
  profile: ProfileRow | null;
  /** Set when the profile row could not be read (e.g. migrations not applied). */
  profileError: string | null;
};

/**
 * Data Access Layer entry point: verifies the session on the server and
 * loads the profile. Deduplicated per request with React cache().
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims?.sub) return null;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", claims.sub)
    .maybeSingle();

  return {
    id: claims.sub,
    email: typeof claims.email === "string" ? claims.email : null,
    profile: profile ?? null,
    profileError: profileError ? (profileError.code ?? profileError.message) : null,
  };
});

/** Returns the signed-in user and a Supabase client, or redirects to login. */
export async function requireUser(
  locale: Locale,
): Promise<{ user: CurrentUser; supabase: SupabaseServerClient }> {
  const [user, supabase] = await Promise.all([getCurrentUser(), createSupabaseServerClient()]);
  if (!user || !supabase) {
    redirect(`${localizedPath(locale, "/login")}?next=${encodeURIComponent(localizedPath(locale, "/dashboard"))}`);
  }
  return { user, supabase };
}
