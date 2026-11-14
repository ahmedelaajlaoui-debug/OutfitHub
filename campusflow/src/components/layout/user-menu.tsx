"use client";

import { ChevronDown, Settings } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { LogoutButton } from "@/features/auth/logout-button";
import { useI18n } from "@/lib/i18n/provider";
import { localizedPath } from "@/lib/routes";

export function UserMenu({ name, email }: { name: string; email: string | null }) {
  const { locale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={t.nav.accountMenu}
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-lg p-1 pe-2 hover:bg-surface-muted"
      >
        <Avatar name={name} className="size-8 text-xs" />
        <span className="hidden max-w-[10rem] truncate text-sm font-medium sm:block">{name}</span>
        <ChevronDown className="size-4 text-muted-foreground" aria-hidden />
      </button>

      {open ? (
        <div
          id={menuId}
          className="absolute end-0 top-full z-40 mt-2 w-64 rounded-xl border border-border bg-surface p-1.5 shadow-raised"
        >
          <div className="border-b border-border px-3 pt-1.5 pb-3">
            <p className="truncate text-sm font-semibold">{name}</p>
            {email ? (
              <p className="truncate text-xs text-muted-foreground" dir="ltr">
                {email}
              </p>
            ) : null}
          </div>
          <div className="pt-1.5">
            <Link
              href={localizedPath(locale, "/settings")}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-surface-muted"
            >
              <Settings className="size-4 text-muted-foreground" aria-hidden />
              {t.nav.settings}
            </Link>
            <LogoutButton />
          </div>
        </div>
      ) : null}
    </div>
  );
}
