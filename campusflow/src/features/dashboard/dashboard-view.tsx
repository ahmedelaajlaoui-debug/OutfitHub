import {
  BookOpen,
  CalendarClock,
  CalendarX2,
  ClipboardList,
  GraduationCap,
  ListTodo,
  MapPin,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { isValidated } from "@/lib/academic/grades";
import { getZonedHour } from "@/lib/academic/time";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { formatDate, formatNumber, interpolate } from "@/lib/i18n/format";
import { localizedPath } from "@/lib/routes";
import { cn } from "@/lib/utils";
import type { ProfileRow, TaskPriority } from "@/types/database";
import type { DashboardData, DashboardResult } from "./queries";

type ViewProps = {
  locale: Locale;
  t: Dictionary;
  name: string;
  profile: ProfileRow | null;
  result: DashboardResult;
  now: Date;
  timeZone: string;
};

function greeting(t: Dictionary, hour: number, name: string): string {
  const template =
    hour < 12 ? t.dashboard.greetingMorning : hour < 18 ? t.dashboard.greetingAfternoon : t.dashboard.greetingEvening;
  return interpolate(template, { name: name.split(/\s+/)[0] ?? name });
}

function StatCard({ icon: Icon, label, value, hint }: { icon: LucideIcon; label: string; value: string; hint: string }) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        </div>
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
          <Icon className="size-5" aria-hidden />
        </div>
      </CardContent>
    </Card>
  );
}

const priorityVariant: Record<TaskPriority, "neutral" | "warning" | "danger"> = {
  low: "neutral",
  medium: "warning",
  high: "danger",
};

export function DashboardView({ locale, t, name, profile, result, now, timeZone }: ViewProps) {
  const d = t.dashboard;
  const today = formatDate(now, locale, { weekday: "long", day: "numeric", month: "long" }, timeZone);
  const profileIncomplete = profile && (!profile.university || !profile.field_of_study || !profile.academic_level);

  return (
    <div className="space-y-6">
      <PageHeader
        title={greeting(t, getZonedHour(now, timeZone), name)}
        description={
          <>
            <span className="capitalize">{today}</span>
            {profile?.university ? <> · {profile.university}</> : null}
            {" — "}
            {d.subtitle}
          </>
        }
      />

      {!profile ? <Alert variant="warning">{d.errors.dbNotReady}</Alert> : null}

      {profileIncomplete ? (
        <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
              <UserRound className="size-5" aria-hidden />
            </div>
            <div>
              <p className="font-semibold">{d.profileCard.title}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{d.profileCard.body}</p>
            </div>
          </div>
          <ButtonLink href={localizedPath(locale, "/settings")} variant="outline" className="shrink-0">
            {d.profileCard.action}
          </ButtonLink>
        </Card>
      ) : null}

      {result.ok ? (
        <DashboardContent locale={locale} t={t} data={result.data} now={now} timeZone={timeZone} />
      ) : (
        <Alert variant={result.reason === "dbNotReady" ? "warning" : "danger"}>
          {result.reason === "dbNotReady" ? d.errors.dbNotReady : d.errors.loadFailed}
        </Alert>
      )}
    </div>
  );
}

function DashboardContent({
  locale,
  t,
  data,
  now,
  timeZone,
}: {
  locale: Locale;
  t: Dictionary;
  data: DashboardData;
  now: Date;
  timeZone: string;
}) {
  const d = t.dashboard;
  const num = (value: number) => formatNumber(value, locale);
  const avg = (value: number) => formatNumber(value, locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const time = (iso: string) => formatDate(iso, locale, { hour: "2-digit", minute: "2-digit" }, timeZone);
  const isEmptyWorkspace =
    data.coursesCount === 0 && data.pendingTasksCount === 0 && data.todayEvents.length === 0 && data.courseAverages.length === 0;

  return (
    <>
      <section aria-label={d.stats.courses} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={BookOpen} label={d.stats.courses} value={num(data.coursesCount)} hint={d.stats.coursesHint} />
        <StatCard
          icon={ListTodo}
          label={d.stats.pendingTasks}
          value={num(data.pendingTasksCount)}
          hint={d.stats.pendingTasksHint}
        />
        <StatCard
          icon={CalendarClock}
          label={d.stats.deadlines}
          value={num(data.upcomingDeadlinesCount)}
          hint={d.stats.deadlinesHint}
        />
        <StatCard
          icon={GraduationCap}
          label={d.stats.average}
          value={data.overallAverage === null ? d.stats.noAverage : avg(data.overallAverage)}
          hint={d.stats.averageHint}
        />
      </section>

      {isEmptyWorkspace ? <Alert variant="info">{d.modulesNotice}</Alert> : null}

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>{d.schedule.title}</CardTitle>
          </CardHeader>
          <CardContent>
            {data.todayEvents.length === 0 ? (
              <EmptyState icon={CalendarX2} title={d.schedule.empty} />
            ) : (
              <ul className="divide-y divide-border">
                {data.todayEvents.map((event) => {
                  const course = event.course_id ? data.coursesById[event.course_id] : undefined;
                  return (
                    <li key={event.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                      <div className="w-16 shrink-0 text-sm font-medium tabular-nums" dir="ltr">
                        {event.all_day ? (
                          <span className="text-xs text-muted-foreground">{d.schedule.allDay}</span>
                        ) : (
                          <>
                            {time(event.starts_at)}
                            <span className="block text-xs font-normal text-muted-foreground">{time(event.ends_at)}</span>
                          </>
                        )}
                      </div>
                      <span
                        aria-hidden
                        className="h-10 w-1 shrink-0 rounded-full"
                        style={{ backgroundColor: course?.color ?? "var(--primary)" }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{event.title}</p>
                        <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                          {course ? <span>{course.name}</span> : null}
                          {event.location ? (
                            <>
                              <MapPin className="ms-1 size-3 shrink-0" aria-hidden />
                              <span className="truncate">{event.location}</span>
                            </>
                          ) : null}
                        </p>
                      </div>
                      <Badge variant={event.type === "exam" ? "danger" : "primary"}>{d.eventTypes[event.type]}</Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{d.deadlines.title}</CardTitle>
          </CardHeader>
          <CardContent>
            {data.deadlines.length === 0 ? (
              <EmptyState icon={ClipboardList} title={d.deadlines.empty} />
            ) : (
              <ul className="space-y-3">
                {data.deadlines.map((task) => {
                  const overdue = task.due_at !== null && new Date(task.due_at) < now;
                  const course = task.course_id ? data.coursesById[task.course_id] : undefined;
                  return (
                    <li key={task.id} className="rounded-lg border border-border p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="min-w-0 truncate text-sm font-medium">{task.title}</p>
                        <Badge variant={priorityVariant[task.priority]}>{d.priority[task.priority]}</Badge>
                      </div>
                      <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                        <span>{course?.name ?? d.deadlines.noCourse}</span>
                        <span aria-hidden>·</span>
                        <span className={cn(overdue && "font-medium text-danger")}>
                          {overdue ? `${d.deadlines.overdue} — ` : null}
                          {task.due_at
                            ? formatDate(task.due_at, locale, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }, timeZone)
                            : null}
                        </span>
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{d.progress.title}</CardTitle>
        </CardHeader>
        <CardContent>
          {data.courseAverages.length === 0 ? (
            <EmptyState icon={GraduationCap} title={d.progress.empty} />
          ) : (
            <ul className="space-y-4">
              {data.courseAverages.map(({ course, average }) => {
                const validated = isValidated(average);
                return (
                  <li key={course.id}>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="min-w-0 truncate font-medium">{course.name}</span>
                      <span className="flex shrink-0 items-center gap-2">
                        <Badge variant={validated ? "success" : "danger"}>
                          {validated ? d.progress.validated : d.progress.notValidated}
                        </Badge>
                        <span className="font-semibold tabular-nums" dir="ltr">
                          {avg(average)}
                          <span className="font-normal text-muted-foreground">{d.progress.outOf}</span>
                        </span>
                      </span>
                    </div>
                    <div
                      className="mt-2 h-2 overflow-hidden rounded-full bg-surface-muted"
                      role="meter"
                      aria-label={course.name}
                      aria-valuemin={0}
                      aria-valuemax={20}
                      aria-valuenow={average}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${(average / 20) * 100}%`, backgroundColor: course.color }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-[124px] rounded-xl" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-5">
        <Skeleton className="h-64 rounded-xl lg:col-span-3" />
        <Skeleton className="h-64 rounded-xl lg:col-span-2" />
      </div>
    </div>
  );
}
