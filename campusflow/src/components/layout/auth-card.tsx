import type { ReactNode } from "react";

export function AuthHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-8">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}

export function AuthFormSkeleton({ fields = 2 }: { fields?: number }): ReactNode {
  return (
    <div className="space-y-5" aria-hidden>
      {Array.from({ length: fields }, (_, index) => (
        <div key={index} className="space-y-2">
          <div className="h-4 w-24 animate-pulse rounded bg-surface-muted" />
          <div className="h-10 animate-pulse rounded-lg bg-surface-muted" />
        </div>
      ))}
      <div className="h-11 animate-pulse rounded-lg bg-surface-muted" />
    </div>
  );
}
