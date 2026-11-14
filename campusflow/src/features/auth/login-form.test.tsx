import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { I18nProvider } from "@/lib/i18n/provider";
import { LoginForm } from "./login-form";

const signInAction = vi.fn();

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("error=confirmation_failed"),
}));
vi.mock("./actions", () => ({ signInAction: (...args: unknown[]) => signInAction(...args) }));

function renderForm(locale: "fr" | "ar", configured = true) {
  return render(
    <I18nProvider locale={locale} dictionary={getDictionary(locale)}>
      <LoginForm configured={configured} />
    </I18nProvider>,
  );
}

describe("LoginForm", () => {
  it("shows translated validation errors and does not call the server", async () => {
    renderForm("ar");
    fireEvent.click(screen.getByRole("button", { name: "تسجيل الدخول" }));
    expect(await screen.findAllByText("هذا الحقل إلزامي.")).toHaveLength(2);
    expect(signInAction).not.toHaveBeenCalled();
  });

  it("shows the configuration notice and disables submit without Supabase", () => {
    renderForm("fr", false);
    expect(screen.getByText("Authentification non configurée")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Se connecter" })).toBeDisabled();
  });

  it("renders errors passed through the URL", () => {
    renderForm("fr");
    expect(screen.getByText(/lien de confirmation est invalide/)).toBeInTheDocument();
  });

  it("submits normalised credentials with the locale and next path", async () => {
    signInAction.mockResolvedValueOnce({ status: "error", error: "invalidCredentials" });
    renderForm("fr");
    fireEvent.change(screen.getByLabelText("Adresse e-mail"), { target: { value: " Amina@Test.MA " } });
    fireEvent.change(screen.getByLabelText("Mot de passe"), { target: { value: "secret123" } });
    fireEvent.click(screen.getByRole("button", { name: "Se connecter" }));
    expect(await screen.findByText("E-mail ou mot de passe incorrect.")).toBeInTheDocument();
    expect(signInAction).toHaveBeenCalledWith({ email: "amina@test.ma", password: "secret123" }, "fr", null);
  });
});
