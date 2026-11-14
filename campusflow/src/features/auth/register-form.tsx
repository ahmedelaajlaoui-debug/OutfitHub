"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheck } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Alert } from "@/components/ui/alert";
import { Button, ButtonLink } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input, Select } from "@/components/ui/input";
import { interpolate } from "@/lib/i18n/format";
import { useI18n } from "@/lib/i18n/provider";
import { localizedPath } from "@/lib/routes";
import { ACADEMIC_LEVELS } from "@/types/database";
import { signUpAction } from "./actions";
import { PasswordInput } from "./password-input";
import { registerSchema, type RegisterInput } from "./schemas";
import { useAuthMessages } from "./use-auth-messages";

export function RegisterForm({ configured }: { configured: boolean }) {
  const { locale, t } = useI18n();
  const { fieldError, actionError } = useAuthMessages();
  const [serverError, setServerError] = useState<string | null>(null);
  const [confirmEmail, setConfirmEmail] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput, unknown, z.output<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      university: "",
      fieldOfStudy: "",
      academicLevel: "",
    },
  });

  const onSubmit = handleSubmit((values) => {
    setServerError(null);
    startTransition(async () => {
      const result = await signUpAction(values, locale);
      if (result?.status === "confirm-email") setConfirmEmail(result.email);
      else if (result?.status === "error") setServerError(actionError(result.error));
    });
  });

  if (confirmEmail) {
    return (
      <div className="space-y-5 text-center" role="status">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-success-soft text-success">
          <MailCheck className="size-6" aria-hidden />
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">{t.auth.checkEmail.title}</h2>
          <p className="text-sm text-muted-foreground">
            {interpolate(t.auth.checkEmail.body, { email: confirmEmail })}
          </p>
        </div>
        <ButtonLink href={localizedPath(locale, "/login")} variant="outline" className="w-full">
          {t.auth.checkEmail.back}
        </ButtonLink>
      </div>
    );
  }

  const optional = t.common.optional;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {!configured ? (
        <Alert variant="warning" title={t.auth.notConfigured.title}>
          {t.auth.notConfigured.body}
        </Alert>
      ) : null}
      {serverError ? <Alert variant="danger">{serverError}</Alert> : null}

      <FormField id="fullName" label={t.auth.fields.fullName} error={fieldError(errors.fullName?.message)}>
        {(describedBy) => (
          <Input
            id="fullName"
            autoComplete="name"
            placeholder={t.auth.fields.fullNamePlaceholder}
            aria-invalid={errors.fullName ? true : undefined}
            aria-describedby={describedBy}
            {...register("fullName")}
          />
        )}
      </FormField>

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

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          id="password"
          label={t.auth.fields.password}
          hint={t.auth.fields.passwordHint}
          error={fieldError(errors.password?.message)}
        >
          {(describedBy) => (
            <PasswordInput
              id="password"
              autoComplete="new-password"
              aria-invalid={errors.password ? true : undefined}
              aria-describedby={describedBy}
              {...register("password")}
            />
          )}
        </FormField>
        <FormField
          id="confirmPassword"
          label={t.auth.fields.confirmPassword}
          error={fieldError(errors.confirmPassword?.message)}
        >
          {(describedBy) => (
            <PasswordInput
              id="confirmPassword"
              autoComplete="new-password"
              aria-invalid={errors.confirmPassword ? true : undefined}
              aria-describedby={describedBy}
              {...register("confirmPassword")}
            />
          )}
        </FormField>
      </div>

      <fieldset className="space-y-4 rounded-lg border border-border p-4">
        <legend className="px-1 text-sm font-semibold">{t.auth.register.academicSection}</legend>
        <FormField
          id="university"
          label={t.auth.fields.university}
          optionalLabel={optional}
          error={fieldError(errors.university?.message)}
        >
          {(describedBy) => (
            <Input
              id="university"
              autoComplete="organization"
              placeholder={t.auth.fields.universityPlaceholder}
              aria-invalid={errors.university ? true : undefined}
              aria-describedby={describedBy}
              {...register("university")}
            />
          )}
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            id="fieldOfStudy"
            label={t.auth.fields.fieldOfStudy}
            optionalLabel={optional}
            error={fieldError(errors.fieldOfStudy?.message)}
          >
            {(describedBy) => (
              <Input
                id="fieldOfStudy"
                placeholder={t.auth.fields.fieldOfStudyPlaceholder}
                aria-invalid={errors.fieldOfStudy ? true : undefined}
                aria-describedby={describedBy}
                {...register("fieldOfStudy")}
              />
            )}
          </FormField>
          <FormField
            id="academicLevel"
            label={t.auth.fields.academicLevel}
            optionalLabel={optional}
            error={fieldError(errors.academicLevel?.message)}
          >
            {(describedBy) => (
              <Select
                id="academicLevel"
                aria-invalid={errors.academicLevel ? true : undefined}
                aria-describedby={describedBy}
                {...register("academicLevel")}
              >
                <option value="">{t.auth.fields.selectLevel}</option>
                {ACADEMIC_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {t.levels[level]}
                  </option>
                ))}
              </Select>
            )}
          </FormField>
        </div>
      </fieldset>

      <Button type="submit" size="lg" className="w-full" loading={isPending} disabled={!configured}>
        {isPending ? t.auth.register.submitting : t.auth.register.submit}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {t.auth.register.hasAccount}{" "}
        <Link href={localizedPath(locale, "/login")} className="font-medium text-primary hover:underline">
          {t.auth.register.loginLink}
        </Link>
      </p>
    </form>
  );
}
