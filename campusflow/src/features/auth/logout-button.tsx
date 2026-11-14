"use client";

import { LogOut } from "lucide-react";
import { useFormStatus } from "react-dom";
import { Spinner } from "@/components/ui/spinner";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";
import { signOutAction } from "./actions";

function SubmitButton({ className }: { className?: string }) {
  const { pending } = useFormStatus();
  const { t } = useI18n();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? <Spinner className="size-4" /> : <LogOut className="size-4 rtl:-scale-x-100" aria-hidden />}
      <span>{t.nav.logout}</span>
    </button>
  );
}

export function LogoutButton({ className }: { className?: string }) {
  const { locale } = useI18n();
  return (
    <form action={signOutAction}>
      <input type="hidden" name="locale" value={locale} />
      <SubmitButton
        className={cn(
          "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-danger hover:bg-danger-soft disabled:opacity-60",
          className,
        )}
      />
    </form>
  );
}
