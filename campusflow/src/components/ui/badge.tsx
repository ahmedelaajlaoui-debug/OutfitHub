import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "neutral" | "primary" | "success" | "warning" | "danger";

const variants: Record<BadgeVariant, string> = {
  neutral: "bg-surface-muted text-muted-foreground",
  primary: "bg-primary-soft text-primary-soft-foreground",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
};

export function Badge({ variant = "neutral", className, ...props }: ComponentProps<"span"> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
