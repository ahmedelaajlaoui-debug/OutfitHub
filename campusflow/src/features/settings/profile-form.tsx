"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input, Select } from "@/components/ui/input";
import { useAuthMessages } from "@/features/auth/use-auth-messages";
import { useI18n } from "@/lib/i18n/provider";
import { ACADEMIC_LEVELS } from "@/types/database";
import { updateProfileAction } from "./actions";
import { profileSchema, type ProfileInput } from "./schemas";

export function ProfileForm({ defaultValues, email }: { defaultValues: ProfileInput; email: string | null }) {
  const { t } = useI18n();
  const { fieldError } = useAuthMessages();
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileInput, unknown, z.output<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues,
  });

  const onSubmit = handleSubmit((values) => {
    setStatus("idle");
    startTransition(async () => {
      const result = await updateProfileAction({
        fullName: values.fullName,
        university: values.university ?? "",
        fieldOfStudy: values.fieldOfStudy ?? "",
        academicLevel: values.academicLevel ?? "",
      });
      if (result.ok) {
        setStatus("saved");
        reset({
          fullName: values.fullName,
          university: values.university ?? "",
          fieldOfStudy: values.fieldOfStudy ?? "",
          academicLevel: values.academicLevel ?? "",
        });
      } else {
        setStatus("error");
      }
    });
  });

  const optional = t.common.optional;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {status === "saved" ? <Alert variant="success">{t.common.saved}</Alert> : null}
      {status === "error" ? <Alert variant="danger">{t.settings.errors.saveFailed}</Alert> : null}

      <FormField id="account-email" label={t.settings.profile.emailLabel}>
        {() => <Input id="account-email" value={email ?? ""} readOnly disabled dir="ltr" />}
      </FormField>

      <FormField id="fullName" label={t.auth.fields.fullName} error={fieldError(errors.fullName?.message)}>
        {(describedBy) => (
          <Input
            id="fullName"
            autoComplete="name"
            aria-invalid={errors.fullName ? true : undefined}
            aria-describedby={describedBy}
            {...register("fullName")}
          />
        )}
      </FormField>

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

      <div className="grid gap-5 sm:grid-cols-2">
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

      <div className="flex justify-end">
        <Button type="submit" loading={isPending} disabled={!isDirty}>
          {isPending ? t.common.saving : t.common.save}
        </Button>
      </div>
    </form>
  );
}
