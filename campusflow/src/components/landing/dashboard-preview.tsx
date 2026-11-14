import { BookOpen, CalendarClock, GraduationCap, ListTodo } from "lucide-react";
import type { Dictionary } from "@/lib/i18n/dictionaries";

/** Static, decorative illustration of the product (not interactive). */
export function DashboardPreview({ t }: { t: Dictionary }) {
  const p = t.landing.preview;
  const stats = [
    { icon: BookOpen, label: p.courses, value: "7" },
    { icon: ListTodo, label: p.tasks, value: "4" },
    { icon: GraduationCap, label: p.average, value: "14,6" },
  ];

  return (
    <figure aria-label={p.label} className="relative">
      <div className="rounded-2xl border border-border bg-surface p-3 shadow-raised sm:p-4">
        <div className="flex items-center gap-1.5 border-b border-border pb-3" aria-hidden>
          <span className="size-2.5 rounded-full bg-border-strong" />
          <span className="size-2.5 rounded-full bg-border-strong" />
          <span className="size-2.5 rounded-full bg-border-strong" />
        </div>
        <div className="space-y-4 pt-4" aria-hidden>
          <div>
            <p className="text-base font-semibold">{p.greeting}</p>
            <p className="text-xs text-muted-foreground">{p.semester}</p>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {stats.map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-lg border border-border p-2.5 sm:p-3">
                <Icon className="size-4 text-primary" />
                <p className="mt-2 text-lg font-semibold tabular-nums" dir="ltr">
                  {value}
                </p>
                <p className="truncate text-[11px] text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-border">
            <p className="border-b border-border px-3 py-2 text-xs font-semibold">{p.today}</p>
            <ul className="divide-y divide-border text-sm">
              {[
                { title: p.class1, meta: p.class1Meta, color: "bg-primary" },
                { title: p.class2, meta: p.class2Meta, color: "bg-success" },
              ].map((item) => (
                <li key={item.title} className="flex items-center gap-3 px-3 py-2.5">
                  <span className={`h-8 w-1 rounded-full ${item.color}`} />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.meta}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-warning-soft px-3 py-2.5 text-sm">
            <CalendarClock className="size-4 shrink-0 text-warning" />
            <div className="min-w-0">
              <p className="truncate font-medium text-foreground">{p.deadline}</p>
              <p className="text-xs text-muted-foreground">{p.deadlineMeta}</p>
            </div>
          </div>
        </div>
      </div>
    </figure>
  );
}
