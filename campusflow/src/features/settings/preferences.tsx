"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { usePathname, useRouter } from "next/navigation";
import { useSyncExternalStore, useTransition } from "react";
import { switchLocalePath } from "@/components/layout/locale-switcher";
import { Label, Select } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { isLocale, localeLabels, locales } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";
import { updateLocaleAction } from "./actions";

const subscribeNoop = () => () => {};

/** True after hydration; avoids rendering theme state that differs from the server. */
function useHydrated() {
  return useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
}

export function LanguageSetting() {
  const { locale, t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-1.5">
      <Label htmlFor="language">{t.common.language}</Label>
      <div className="flex items-center gap-2">
        <Select
          id="language"
          value={locale}
          disabled={isPending}
          aria-describedby="language-hint"
          onChange={(event) => {
            const next = event.target.value;
            if (!isLocale(next) || next === locale) return;
            startTransition(async () => {
              // Persist in the profile; navigation works even if saving fails.
              await updateLocaleAction(next);
              router.replace(switchLocalePath(pathname, next));
            });
          }}
          className="max-w-xs"
        >
          {locales.map((value) => (
            <option key={value} value={value} lang={value}>
              {localeLabels[value]}
            </option>
          ))}
        </Select>
        {isPending ? <Spinner className="size-4 text-muted-foreground" label={t.common.saving} /> : null}
      </div>
      <p id="language-hint" className="text-xs text-muted-foreground">
        {t.settings.preferences.languageHint}
      </p>
    </div>
  );
}

export function ThemeSetting() {
  const { t } = useI18n();
  const { theme, setTheme } = useTheme();
  const hydrated = useHydrated();
  const options = [
    { value: "light", label: t.common.themeLight, icon: Sun },
    { value: "dark", label: t.common.themeDark, icon: Moon },
    { value: "system", label: t.common.themeSystem, icon: Monitor },
  ] as const;

  return (
    <fieldset className="space-y-1.5">
      <legend className="text-sm font-medium">{t.common.theme}</legend>
      <div className="grid max-w-md grid-cols-3 gap-2 pt-1.5">
        {options.map(({ value, label, icon: Icon }) => {
          const checked = hydrated && theme === value;
          return (
            <label
              key={value}
              className={cn(
                "flex cursor-pointer flex-col items-center gap-2 rounded-lg border px-3 py-3 text-sm font-medium transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring",
                checked
                  ? "border-primary bg-primary-soft text-primary-soft-foreground"
                  : "border-border hover:bg-surface-muted",
              )}
            >
              <input
                type="radio"
                name="theme"
                value={value}
                checked={checked}
                onChange={() => setTheme(value)}
                className="sr-only"
              />
              <Icon className="size-5" aria-hidden />
              {label}
            </label>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">{t.settings.preferences.themeHint}</p>
    </fieldset>
  );
}
