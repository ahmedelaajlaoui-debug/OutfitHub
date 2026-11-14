"use client";

import { useI18n } from "@/lib/i18n/provider";
import type { AuthActionResult } from "./actions";
import type { ValidationKey } from "./schemas";

/** Translates validation keys and action errors for auth forms. */
export function useAuthMessages() {
  const { t } = useI18n();

  const fieldError = (message: string | undefined): string | undefined => {
    if (!message) return undefined;
    return message in t.validation ? t.validation[message as ValidationKey] : t.auth.errors.generic;
  };

  const actionError = (error: Extract<AuthActionResult, { status: "error" }>["error"]): string => {
    if (error === "notConfigured") return t.auth.notConfigured.body;
    if (error === "invalidInput") return t.auth.errors.generic;
    return t.auth.errors[error];
  };

  return { fieldError, actionError };
}
