import type { Dictionary } from "@/lib/i18n/dictionaries";

export type AuthErrorKey = keyof Dictionary["auth"]["errors"];

/** Maps Supabase Auth error codes to translated messages (never leak raw errors). */
export function mapAuthError(error: { code?: string; status?: number } | null | undefined): AuthErrorKey {
  switch (error?.code) {
    case "invalid_credentials":
      return "invalidCredentials";
    case "email_not_confirmed":
      return "emailNotConfirmed";
    case "user_already_exists":
    case "email_exists":
      return "userExists";
    case "weak_password":
      return "weakPassword";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "rateLimited";
    default:
      return error?.status === 429 ? "rateLimited" : "generic";
  }
}
