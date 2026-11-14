"use client";

import { ErrorState } from "@/components/layout/error-state";

export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <ErrorState onRetry={reset} />
    </div>
  );
}
