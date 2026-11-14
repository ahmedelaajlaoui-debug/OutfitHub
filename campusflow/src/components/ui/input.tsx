import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export const fieldClasses =
  "block w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground shadow-card " +
  "placeholder:text-muted-foreground/70 transition-colors " +
  "hover:border-border-strong focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 " +
  "disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-70 " +
  "aria-invalid:border-danger aria-invalid:focus:ring-danger/20";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(fieldClasses, "h-10", className)} {...props} />;
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <select className={cn(fieldClasses, "h-10 pe-8", className)} {...props}>
      {children}
    </select>
  );
}

export function Label({ className, ...props }: ComponentProps<"label">) {
  return <label className={cn("text-sm font-medium text-foreground", className)} {...props} />;
}
