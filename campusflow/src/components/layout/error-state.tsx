"use client";

import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/provider";

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  const { t } = useI18n();
  return (
    <div role="alert" className="flex max-w-md flex-col items-center text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-danger-soft text-danger">
        <TriangleAlert className="size-6" aria-hidden />
      </div>
      <h1 className="mt-4 text-lg font-semibold">{t.errors.boundaryTitle}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t.errors.boundaryBody}</p>
      <Button variant="outline" className="mt-5" onClick={onRetry}>
        {t.common.retry}
      </Button>
    </div>
  );
}
