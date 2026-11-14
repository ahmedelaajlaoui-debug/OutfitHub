"use client";

import { Compass } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/provider";
import { localizedPath } from "@/lib/routes";

export default function NotFound() {
  const { locale, t } = useI18n();
  return (
    <main id="main" className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-primary-soft text-primary">
        <Compass className="size-6" aria-hidden />
      </div>
      <p className="mt-6 text-sm font-semibold text-primary">404</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">{t.errors.notFoundTitle}</h1>
      <p className="mt-2 max-w-md text-muted-foreground">{t.errors.notFoundBody}</p>
      <ButtonLink href={localizedPath(locale, "/")} variant="outline" className="mt-6">
        {t.common.backToHome}
      </ButtonLink>
    </main>
  );
}
