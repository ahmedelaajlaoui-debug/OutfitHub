"use client";

import { ErrorState } from "@/components/layout/error-state";

export default function LocaleError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="main" className="flex min-h-dvh items-center justify-center px-4">
      <ErrorState onRetry={reset} />
    </main>
  );
}
