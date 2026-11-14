import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "./schemas";

const valid = {
  fullName: "  Salma El Amrani ",
  email: " Salma@Example.MA ",
  password: "motdepasse1",
  confirmPassword: "motdepasse1",
  university: "",
  fieldOfStudy: "SMI",
  academicLevel: "licence_3",
};

const firstMessage = (result: { success: boolean; error?: { issues: { message: string }[] } }) =>
  result.error?.issues[0]?.message;

describe("auth schemas", () => {
  it("normalises valid registration input", () => {
    const result = registerSchema.safeParse(valid);
    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      fullName: "Salma El Amrani",
      email: "salma@example.ma",
      university: undefined,
      fieldOfStudy: "SMI",
      academicLevel: "licence_3",
    });
  });

  it("returns dictionary keys as messages", () => {
    expect(firstMessage(registerSchema.safeParse({ ...valid, email: "nope" }))).toBe("emailInvalid");
    expect(firstMessage(registerSchema.safeParse({ ...valid, password: "short1", confirmPassword: "short1" }))).toBe(
      "passwordMin",
    );
    expect(
      firstMessage(registerSchema.safeParse({ ...valid, password: "onlyletters", confirmPassword: "onlyletters" })),
    ).toBe("passwordWeak");
    expect(firstMessage(registerSchema.safeParse({ ...valid, confirmPassword: "different1" }))).toBe(
      "passwordsMismatch",
    );
    expect(firstMessage(registerSchema.safeParse({ ...valid, fullName: "A" }))).toBe("nameMin");
    expect(firstMessage(registerSchema.safeParse({ ...valid, academicLevel: "phd" }))).toBe("invalidOption");
  });

  it("accepts Arabic letters in passwords", () => {
    expect(registerSchema.safeParse({ ...valid, password: "كلمةسر2026", confirmPassword: "كلمةسر2026" }).success).toBe(
      true,
    );
  });

  it("requires login fields", () => {
    expect(firstMessage(loginSchema.safeParse({ email: "", password: "x" }))).toBe("required");
    expect(firstMessage(loginSchema.safeParse({ email: "a@b.ma", password: "" }))).toBe("required");
  });
});
