"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n/provider";
import { localizedPath } from "@/lib/routes";
import { signInAction } from "./actions";
import { PasswordInput } from "./password-input";
import { loginSchema, type LoginInput } from "./schemas";
import { useAuthMessages } from "./use-auth-messages";

const URL_ERRORS = { confirmation_failed: "confirmationFailed", session_expired: "sessionExpired" } as const;

export function LoginForm({ configured }: { configured: boolean }) {
  const { locale, t } = useI18n();
  const searchParams = useSearchParams();
  const { fieldError, actionError } = useAuthMessages();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const urlErrorKey = searchParams.get("error");
  const urlError =
    urlErrorKey && urlErrorKey in URL_ERRORS
      ? t.auth.errors[URL_ERRORS[urlErrorKey as keyof typeof URL_ERRORS]]
      : null;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput, unknown, z.output<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit((values) => {
    setServerError(null);
    startTransition(async () => {
      const result = await signInAction(values, locale, searchParams.get("next"));
      // On success the action redirects; a returned value is always an error.
      if (result?.status === "error") setServerError(actionError(result.error));
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {!configured ? (
        <Alert variant="warning" title={t.auth.notConfigured.title}>
          {t.auth.notConfigured.body}
        </Alert>
      ) : null}
      {serverError ?? urlError ? <Alert variant="danger">{serverError ?? urlError}</Alert> : null}

      <FormField id="email" label={t.auth.fields.email} error={fieldError(errors.email?.message)}>
        {(describedBy) => (
          <Input
            id="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            dir="ltr"
            placeholder={t.auth.fields.emailPlaceholder}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={describedBy}
            {...register("email")}
          />
        )}
      </FormField>

      <FormField id="password" label={t.auth.fields.password} error={fieldError(errors.password?.message)}>
        {(describedBy) => (
          <PasswordInput
            id="password"
            autoComplete="current-password"
            aria-invalid={errors.password ? true : undefined}
            aria-describedby={describedBy}
            {...register("password")}
          />
        )}
      </FormField>

      <Button type="submit" size="lg" className="w-full" loading={isPending} disabled={!configured}>
        {isPending ? t.auth.login.submitting : t.auth.login.submit}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {t.auth.login.noAccount}{" "}
        <Link href={localizedPath(locale, "/register")} className="font-medium text-primary hover:underline">
          {t.auth.login.registerLink}
        </Link>
      </p>
    </form>
  );
}
