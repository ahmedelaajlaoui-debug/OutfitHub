"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { accountNav, workspaceNav, type NavItem } from "@/config/navigation";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n/provider";
import { localizedPath, splitLocale } from "@/lib/routes";
import { cn } from "@/lib/utils";

const itemBase = "flex h-9 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors";

function NavEntry({ item, active, onNavigate }: { item: NavItem; active: boolean; onNavigate?: () => void }) {
  const { locale, t } = useI18n();
  const Icon = item.icon;
  const label = t.nav[item.key];

  if (item.status === "soon") {
    return (
      <li>
        <span
          aria-disabled="true"
          title={t.nav.upcomingModule}
          className={cn(itemBase, "cursor-not-allowed text-muted-foreground/70")}
        >
          <Icon className="size-[18px] shrink-0" aria-hidden />
          <span className="flex-1 truncate">{label}</span>
          <Badge className="text-[10px]">{t.common.comingSoon}</Badge>
          <span className="sr-only">— {t.nav.upcomingModule}</span>
        </span>
      </li>
    );
  }

  return (
    <li>
      <Link
        href={localizedPath(locale, item.href)}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        className={cn(
          itemBase,
          active
            ? "bg-primary-soft text-primary-soft-foreground"
            : "text-muted-foreground hover:bg-surface-muted hover:text-foreground",
        )}
      >
        <Icon className="size-[18px] shrink-0" aria-hidden />
        <span className="truncate">{label}</span>
      </Link>
    </li>
  );
}

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useI18n();
  const { path } = splitLocale(usePathname());
  const isActive = (href: string) => path === href || path.startsWith(`${href}/`);

  return (
    <nav aria-label={t.nav.main} className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-4">
      <div>
        <p className="px-3 pb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {t.nav.workspace}
        </p>
        <ul className="space-y-0.5">
          {workspaceNav.map((item) => (
            <NavEntry key={item.key} item={item} active={isActive(item.href)} onNavigate={onNavigate} />
          ))}
        </ul>
      </div>
      <div className="mt-auto">
        <p className="px-3 pb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {t.nav.account}
        </p>
        <ul className="space-y-0.5">
          {accountNav.map((item) => (
            <NavEntry key={item.key} item={item} active={isActive(item.href)} onNavigate={onNavigate} />
          ))}
        </ul>
      </div>
    </nav>
  );
}
