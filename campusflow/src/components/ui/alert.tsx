import { CircleAlert, CircleCheck, Info, TriangleAlert, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type AlertVariant = "info" | "success" | "warning" | "danger";

const styles: Record<AlertVariant, { container: string; icon: LucideIcon }> = {
  info: { container: "border-primary/20 bg-primary-soft text-primary-soft-foreground", icon: Info },
  success: { container: "border-success/20 bg-success-soft text-success", icon: CircleCheck },
  warning: { container: "border-warning/25 bg-warning-soft text-warning", icon: TriangleAlert },
  danger: { container: "border-danger/20 bg-danger-soft text-danger", icon: CircleAlert },
};

export function Alert({
  variant = "info",
  title,
  children,
  className,
}: {
  variant?: AlertVariant;
  title?: string;
  children?: ReactNode;
  className?: string;
}) {
  const { container, icon: Icon } = styles[variant];
  return (
    <div
      role={variant === "danger" || variant === "warning" ? "alert" : "status"}
      className={cn("flex gap-3 rounded-lg border px-4 py-3 text-sm", container, className)}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="space-y-1">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className="leading-relaxed opacity-90">{children}</div> : null}
      </div>
    </div>
  );
}
