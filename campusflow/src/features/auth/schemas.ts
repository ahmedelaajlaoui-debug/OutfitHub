import { z } from "zod";
import { ACADEMIC_LEVELS } from "@/types/database";
import type { Dictionary } from "@/lib/i18n/dictionaries";

/**
 * Validation messages are dictionary keys, translated in the UI.
 * The same schemas run in the browser (React Hook Form) and on the server.
 */
export type ValidationKey = keyof Dictionary["validation"];

const msg = (key: ValidationKey) => ({ message: key });

export const emailSchema = z
  .string()
  .trim()
  .min(1, msg("required"))
  .max(254, msg("tooLong"))
  .pipe(z.email(msg("emailInvalid")))
  .transform((value) => value.toLowerCase());

export const passwordSchema = z
  .string()
  .min(8, msg("passwordMin"))
  .max(72, msg("passwordMax"))
  .refine((value) => /\p{L}/u.test(value) && /\d/.test(value), msg("passwordWeak"));

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, msg("tooLong"))
    .optional()
    .transform((value) => (value ? value : undefined));

export const fullNameSchema = z.string().trim().min(2, msg("nameMin")).max(120, msg("tooLong"));

export const academicLevelSchema = z
  .enum(["", ...ACADEMIC_LEVELS], msg("invalidOption"))
  .optional()
  .transform((value) => (value ? value : undefined));

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, msg("required")).max(72, msg("passwordMax")),
});

export const registerSchema = z
  .object({
    fullName: fullNameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, msg("required")),
    university: optionalText(160),
    fieldOfStudy: optionalText(120),
    academicLevel: academicLevelSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "passwordsMismatch" satisfies ValidationKey,
  });

export type LoginInput = z.input<typeof loginSchema>;
export type RegisterInput = z.input<typeof registerSchema>;
