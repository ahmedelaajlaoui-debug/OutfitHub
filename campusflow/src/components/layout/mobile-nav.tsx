"use client";

import { Menu, X } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/provider";
import { localizedPath } from "@/lib/routes";
import { Logo } from "./logo";
import { SidebarNav } from "./sidebar-nav";

/**
 * Off-canvas navigation for phones and tablets, built on <dialog> for
 * native focus trapping, Escape handling and inert background content.
 */
export function MobileNav() {
  const { locale, t } = useI18n();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const close = () => dialogRef.current?.close();

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        aria-label={t.common.openMenu}
        aria-haspopup="dialog"
        onClick={() => dialogRef.current?.showModal()}
      >
        <Menu className="size-5" aria-hidden />
      </Button>
      <dialog
        ref={dialogRef}
        aria-label={t.nav.main}
        onClick={(event) => {
          if (event.target === dialogRef.current) close();
        }}
        className="m-0 h-dvh max-h-dvh w-72 max-w-[85vw] border-e border-border bg-surface p-0 text-foreground shadow-raised open:flex open:flex-col inset-y-0 start-0 end-auto lg:hidden"
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <Logo href={localizedPath(locale, "/dashboard")} />
          <Button variant="ghost" size="icon" aria-label={t.common.closeMenu} onClick={close} autoFocus>
            <X className="size-5" aria-hidden />
          </Button>
        </div>
        <SidebarNav onNavigate={close} />
      </dialog>
    </>
  );
}
