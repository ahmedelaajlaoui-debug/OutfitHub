"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/provider";

/** Icons switch through CSS (dark: variant), so there is no hydration mismatch. */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const { t } = useI18n();

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={t.common.toggleTheme}
      title={t.common.toggleTheme}
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <Moon className="size-[18px] dark:hidden" aria-hidden />
      <Sun className="hidden size-[18px] dark:block" aria-hidden />
    </Button>
  );
}
