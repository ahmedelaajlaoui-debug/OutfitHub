import { z } from "zod";
import { academicLevelSchema, fullNameSchema, type ValidationKey } from "@/features/auth/schemas";
import { locales } from "@/lib/i18n/config";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, { message: "tooLong" satisfies ValidationKey })
    .transform((value) => (value ? value : null));

export const profileSchema = z.object({
  fullName: fullNameSchema,
  university: optionalText(160),
  fieldOfStudy: optionalText(120),
  academicLevel: academicLevelSchema.transform((value) => value ?? null),
});

export const localeSchema = z.enum(locales);

export type ProfileInput = z.input<typeof profileSchema>;
