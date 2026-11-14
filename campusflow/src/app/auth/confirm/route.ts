import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { isLocale, LOCALE_COOKIE } from "@/lib/i18n/config";
import { localizedPath, safeRedirectPath } from "@/lib/routes";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const OTP_TYPES: readonly EmailOtpType[] = ["signup", "email", "invite", "magiclink", "recovery", "email_change"];

/**
 * Email confirmation endpoint. Supports both Supabase link formats:
 *  - PKCE:       /auth/confirm?code=...                (default email template)
 *  - Token hash: /auth/confirm?token_hash=...&type=... (recommended template, works across devices)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(cookieLocale) ? cookieLocale : "fr";
  const next = safeRedirectPath(searchParams.get("next"), locale);
  const failure = new URL(`${localizedPath(locale, "/login")}?error=confirmation_failed`, request.url);

  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.redirect(failure);

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  let ok = false;
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
  } else if (tokenHash && type && OTP_TYPES.includes(type)) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    ok = !error;
  }

  return NextResponse.redirect(ok ? new URL(next, request.url) : failure);
}
