import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Label } from "./input";

type FormFieldProps = {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  optionalLabel?: string;
  className?: string;
  /** Receives the ids to wire into aria-describedby. */
  children: (describedBy: string | undefined) => ReactNode;
};

export function FormField({ id, label, error, hint, optionalLabel, className, children }: FormFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id}>
        {label}
        {optionalLabel ? (
          <span className="ms-1 text-xs font-normal text-muted-foreground">({optionalLabel})</span>
        ) : null}
      </Label>
      {children(describedBy)}
      {hint && !error ? (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-xs font-medium text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
