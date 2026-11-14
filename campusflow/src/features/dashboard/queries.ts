import "server-only";

import { computeCourseAverage, computeOverallAverage } from "@/lib/academic/grades";
import { getZonedDayRange } from "@/lib/academic/time";
import type { SupabaseServerClient } from "@/lib/supabase/server";
import type { CourseRow, EventRow, TaskRow } from "@/types/database";

export type DashboardCourse = Pick<CourseRow, "id" | "name" | "code" | "color" | "coefficient">;

export type DashboardData = {
  coursesCount: number;
  pendingTasksCount: number;
  upcomingDeadlinesCount: number;
  deadlines: Pick<TaskRow, "id" | "title" | "due_at" | "priority" | "course_id">[];
  todayEvents: Pick<EventRow, "id" | "title" | "type" | "location" | "starts_at" | "ends_at" | "all_day" | "course_id">[];
  courseAverages: { course: DashboardCourse; average: number }[];
  overallAverage: number | null;
  coursesById: Record<string, DashboardCourse>;
};

export type DashboardResult = { ok: true; data: DashboardData } | { ok: false; reason: "dbNotReady" | "loadFailed" };

const MISSING_RELATION_CODES = new Set(["42P01", "PGRST205", "PGRST202"]);
const DAY_MS = 24 * 60 * 60 * 1000;

export async function getDashboardData(
  supabase: SupabaseServerClient,
  options: { timeZone: string; now: Date },
): Promise<DashboardResult> {
  const { now, timeZone } = options;
  const nowIso = now.toISOString();
  const weekAheadIso = new Date(now.getTime() + 7 * DAY_MS).toISOString();
  const { start, end } = getZonedDayRange(now, timeZone);

  // RLS restricts every query to the signed-in user's rows.
  const [courses, pending, upcomingCount, deadlines, events, grades] = await Promise.all([
    supabase.from("courses").select("id, name, code, color, coefficient").is("archived_at", null).order("name"),
    supabase.from("tasks").select("id", { count: "exact", head: true }).neq("status", "done"),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .neq("status", "done")
      .gte("due_at", nowIso)
      .lte("due_at", weekAheadIso),
    supabase
      .from("tasks")
      .select("id, title, due_at, priority, course_id")
      .neq("status", "done")
      .not("due_at", "is", null)
      .lte("due_at", weekAheadIso)
      .order("due_at", { ascending: true })
      .limit(6),
    supabase
      .from("events")
      .select("id, title, type, location, starts_at, ends_at, all_day, course_id")
      .lt("starts_at", end.toISOString())
      .gte("ends_at", start.toISOString())
      .order("starts_at", { ascending: true })
      .limit(12),
    supabase.from("grades").select("course_id, score, max_score, weight"),
  ]);

  const errors = [courses.error, pending.error, upcomingCount.error, deadlines.error, events.error, grades.error].filter(
    (error) => error !== null,
  );
  if (errors.length > 0) {
    const missing = errors.some((error) => MISSING_RELATION_CODES.has(error.code));
    return { ok: false, reason: missing ? "dbNotReady" : "loadFailed" };
  }

  const courseList = courses.data ?? [];
  const coursesById = Object.fromEntries(courseList.map((course) => [course.id, course]));

  const gradesByCourse = new Map<string, { score: number; maxScore: number; weight: number }[]>();
  for (const grade of grades.data ?? []) {
    const list = gradesByCourse.get(grade.course_id) ?? [];
    list.push({ score: Number(grade.score), maxScore: Number(grade.max_score), weight: Number(grade.weight) });
    gradesByCourse.set(grade.course_id, list);
  }

  const courseAverages = courseList.flatMap((course) => {
    const average = computeCourseAverage(gradesByCourse.get(course.id) ?? []);
    return average === null ? [] : [{ course, average }];
  });

  return {
    ok: true,
    data: {
      coursesCount: courseList.length,
      pendingTasksCount: pending.count ?? 0,
      upcomingDeadlinesCount: upcomingCount.count ?? 0,
      deadlines: deadlines.data ?? [],
      todayEvents: events.data ?? [],
      courseAverages,
      overallAverage: computeOverallAverage(
        courseAverages.map(({ course, average }) => ({ coefficient: Number(course.coefficient), average })),
      ),
      coursesById,
    },
  };
}
