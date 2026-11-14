import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";
import { getSupabasePublicEnv } from "./env";

/**
 * Supabase client for Server Components, Server Actions and Route Handlers.
 * Requests run as the signed-in user, so Row Level Security applies.
 * Returns null when Supabase is not configured.
 */
export async function createSupabaseServerClient() {
  const env = getSupabasePublicEnv();
  if (!env) return null;

  const cookieStore = await cookies();

  return createServerClient<Database>(env.url, env.publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component, where cookies are read-only.
          // The proxy refreshes the session cookies on every request instead.
        }
      },
    },
  });
}

export type SupabaseServerClient = NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>;
