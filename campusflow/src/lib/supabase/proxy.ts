import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";
import { getSupabasePublicEnv } from "./env";

/**
 * Refreshes the Supabase session cookie for the current request and returns
 * the verified user id (or null). Must run before any rendering.
 */
export async function updateSession(
  request: NextRequest,
): Promise<{ response: NextResponse; userId: string | null }> {
  let response = NextResponse.next({ request });
  const env = getSupabasePublicEnv();
  if (!env) return { response, userId: null };

  const supabase = createServerClient<Database>(env.url, env.publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
        for (const [key, value] of Object.entries(headers ?? {})) response.headers.set(key, value);
      },
    },
  });

  // getClaims() validates the JWT (signature + expiry) and refreshes it when needed.
  // Do not run other code between client creation and this call.
  try {
    const { data } = await supabase.auth.getClaims();
    const sub = data?.claims?.sub;
    return { response, userId: typeof sub === "string" ? sub : null };
  } catch {
    return { response, userId: null };
  }
}

/** Copies refreshed auth cookies onto a redirect so the session is not lost. */
export function redirectWithCookies(url: URL, source: NextResponse): NextResponse {
  const redirect = NextResponse.redirect(url);
  for (const cookie of source.cookies.getAll()) redirect.cookies.set(cookie);
  return redirect;
}
