import { Logo } from "./logo";
import { SidebarNav } from "./sidebar-nav";

export function AppSidebar({ homeHref }: { homeHref: string }) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-e border-border bg-surface lg:flex">
      <div className="flex h-16 items-center border-b border-border px-5">
        <Logo href={homeHref} />
      </div>
      <SidebarNav />
    </aside>
  );
}
