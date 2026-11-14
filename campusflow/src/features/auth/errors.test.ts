import { describe, expect, it } from "vitest";
import { mapAuthError } from "./errors";

describe("mapAuthError", () => {
  it.each([
    [{ code: "invalid_credentials" }, "invalidCredentials"],
    [{ code: "email_not_confirmed" }, "emailNotConfirmed"],
    [{ code: "user_already_exists" }, "userExists"],
    [{ code: "weak_password" }, "weakPassword"],
    [{ code: "over_email_send_rate_limit" }, "rateLimited"],
    [{ status: 429 }, "rateLimited"],
    [{ code: "something_new" }, "generic"],
    [null, "generic"],
  ])("maps %o to %s", (error, expected) => {
    expect(mapAuthError(error)).toBe(expected);
  });
});
