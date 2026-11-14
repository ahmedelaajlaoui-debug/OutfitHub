import { NextResponse, type NextRequest } from "next/server";
import { isLocale, LOCALE_COOKIE, negotiateLocale } from "@/lib/i18n/config";
import { isAuthPath, isProtectedPath, localizedPath, splitLocale } from "@/lib/routes";
import { redirectWithCookies, updateSession } from "@/lib/supabase/proxy";

const ONE_YEAR = 60 * 60 * 24 * 365;

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Locale-independent auth callbacks: only refresh the session.
  if (pathname.startsWith("/auth/")) {
    return (await updateSession(request)).response;
  }

  const { locale, path } = splitLocale(pathname);

  // 1. Ensure every page URL carries a supported locale.
  if (!locale) {
    const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
    const preferred = isLocale(cookieLocale)
      ? cookieLocale
      : negotiateLocale(request.headers.get("accept-language"));
    const url = request.nextUrl.clone();
    url.pathname = localizedPath(preferred, pathname);
    return NextResponse.redirect(url);
  }

  // 2. Refresh the session and get the verified user id.
  const { response, userId } = await updateSession(request);

  // 3. Route protection (pages also verify the user on the server).
  if (isProtectedPath(path) && !userId) {
    const url = request.nextUrl.clone();
    url.pathname = localizedPath(locale, "/login");
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return redirectWithCookies(url, response);
  }
  if (isAuthPath(path) && userId) {
    const url = request.nextUrl.clone();
    url.pathname = localizedPath(locale, "/dashboard");
    url.search = "";
    return redirectWithCookies(url, response);
  }

  // 4. Remember the language from the URL.
  if (request.cookies.get(LOCALE_COOKIE)?.value !== locale) {
    response.cookies.set(LOCALE_COOKIE, locale, { path: "/", maxAge: ONE_YEAR, sameSite: "lax" });
  }
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};
