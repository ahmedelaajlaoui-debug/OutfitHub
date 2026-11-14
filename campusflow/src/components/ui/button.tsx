import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "./spinner";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

const base =
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-colors " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring " +
  "disabled:pointer-events-none disabled:opacity-60 aria-disabled:pointer-events-none aria-disabled:opacity-60";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-primary text-primary-foreground shadow-card hover:bg-primary-hover",
  secondary: "bg-primary-soft text-primary-soft-foreground hover:bg-primary-soft/70",
  outline: "border border-border bg-surface text-foreground shadow-card hover:bg-surface-muted",
  ghost: "text-muted-foreground hover:bg-surface-muted hover:text-foreground",
  danger: "bg-danger text-white shadow-card hover:opacity-90",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-base",
  icon: "size-9",
};

export function buttonClasses(variant: ButtonVariant = "primary", size: ButtonSize = "md", className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

type ButtonProps = ComponentProps<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses(variant, size, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Spinner className="size-4" /> : null}
      {children}
    </button>
  );
}

type ButtonLinkProps = ComponentProps<typeof Link> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function ButtonLink({ variant = "primary", size = "md", className, ...props }: ButtonLinkProps) {
  return <Link className={buttonClasses(variant, size, className)} {...props} />;
}
