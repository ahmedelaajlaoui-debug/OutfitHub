/**
 * Database types for the Supabase client, mirroring supabase/migrations.
 *
 * Hand-maintained for Phase 1. Once a Supabase project is linked, you can
 * regenerate an equivalent file with:
 *   npx supabase gen types typescript --linked > src/types/database.ts
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Timestamps = { created_at: string; updated_at: string };

/** Builds the Row/Insert/Update shape expected by supabase-js. */
type TableDef<Row, Required extends keyof Row> = {
  Row: Row;
  Insert: Pick<Row, Required> & Partial<Omit<Row, Required>>;
  Update: Partial<Row>;
  Relationships: [];
};

export type AppLocale = "fr" | "ar";
export type ThemePreference = "light" | "dark" | "system";
export type UserRole = "student" | "moderator" | "admin";
export type AcademicLevel =
  | "licence_1"
  | "licence_2"
  | "licence_3"
  | "master_1"
  | "master_2"
  | "prepa_1"
  | "prepa_2"
  | "ingenieur_1"
  | "ingenieur_2"
  | "ingenieur_3"
  | "doctorat"
  | "other";
export type TaskPriority = "low" | "medium" | "high";
export type TaskStatus = "todo" | "in_progress" | "done";
export type EventType = "class" | "exam" | "deadline" | "study" | "other";
export type QuizSource = "manual" | "ai";
export type AttemptStatus = "in_progress" | "submitted" | "expired";
export type AssessmentType = "exam" | "continuous" | "practical" | "project" | "other";
export type GroupVisibility = "public" | "private";
export type GroupRole = "owner" | "moderator" | "member";
export type ContentStatus = "visible" | "hidden" | "removed";
export type ReportStatus = "open" | "reviewed" | "dismissed";
export type NotificationType = "deadline" | "exam" | "community" | "system";

export type ProfileRow = Timestamps & {
  id: string;
  full_name: string;
  university: string | null;
  field_of_study: string | null;
  academic_level: AcademicLevel | null;
  locale: AppLocale;
  theme: ThemePreference;
  timezone: string;
  role: UserRole;
  avatar_path: string | null;
  email_notifications: boolean;
  deadline_reminders: boolean;
};

export type SemesterRow = Timestamps & {
  id: string;
  user_id: string;
  name: string;
  academic_year: string;
  starts_on: string | null;
  ends_on: string | null;
  is_current: boolean;
};

export type CourseRow = Timestamps & {
  id: string;
  user_id: string;
  semester_id: string | null;
  name: string;
  code: string | null;
  instructor: string | null;
  coefficient: number;
  credits: number | null;
  color: string;
  description: string | null;
  archived_at: string | null;
};

export type MaterialRow = Timestamps & {
  id: string;
  user_id: string;
  course_id: string | null;
  title: string;
  description: string | null;
  storage_path: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  page_count: number | null;
};

export type TaskRow = Timestamps & {
  id: string;
  user_id: string;
  course_id: string | null;
  title: string;
  description: string | null;
  due_at: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  completed_at: string | null;
};

export type EventRow = Timestamps & {
  id: string;
  user_id: string;
  course_id: string | null;
  title: string;
  description: string | null;
  type: EventType;
  location: string | null;
  starts_at: string;
  ends_at: string;
  all_day: boolean;
};

export type QuizRow = Timestamps & {
  id: string;
  user_id: string;
  course_id: string | null;
  material_id: string | null;
  title: string;
  description: string | null;
  time_limit_seconds: number | null;
  source: QuizSource;
  shuffle_questions: boolean;
};

export type QuestionRow = Timestamps & {
  id: string;
  quiz_id: string;
  position: number;
  prompt: string;
  explanation: string | null;
  points: number;
};

export type AnswerRow = {
  id: string;
  question_id: string;
  position: number;
  label: string;
  is_correct: boolean;
  created_at: string;
};

export type QuizAttemptRow = {
  id: string;
  quiz_id: string;
  user_id: string;
  status: AttemptStatus;
  started_at: string;
  expires_at: string | null;
  submitted_at: string | null;
  score: number | null;
  max_score: number | null;
};

export type AttemptAnswerRow = {
  attempt_id: string;
  question_id: string;
  answer_id: string;
};

export type GradeRow = Timestamps & {
  id: string;
  user_id: string;
  course_id: string;
  label: string;
  assessment_type: AssessmentType;
  score: number;
  max_score: number;
  weight: number;
  graded_on: string | null;
};

export type GroupRow = Timestamps & {
  id: string;
  name: string;
  description: string | null;
  visibility: GroupVisibility;
  created_by: string | null;
};

export type GroupMemberRow = {
  group_id: string;
  user_id: string;
  role: GroupRole;
  joined_at: string;
};

export type PostRow = Timestamps & {
  id: string;
  group_id: string;
  author_id: string;
  body: string;
  status: ContentStatus;
  moderated_by: string | null;
  moderated_at: string | null;
};

export type CommentRow = Timestamps & {
  id: string;
  post_id: string;
  author_id: string;
  body: string;
  status: ContentStatus;
  moderated_by: string | null;
  moderated_at: string | null;
};

export type ContentReportRow = {
  id: string;
  reporter_id: string;
  post_id: string | null;
  comment_id: string | null;
  reason: string;
  status: ReportStatus;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
};

export type NotificationRow = {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: TableDef<ProfileRow, "id" | "full_name">;
      semesters: TableDef<SemesterRow, "user_id" | "name" | "academic_year">;
      courses: TableDef<CourseRow, "user_id" | "name">;
      materials: TableDef<MaterialRow, "user_id" | "title" | "storage_path" | "file_name" | "size_bytes">;
      tasks: TableDef<TaskRow, "user_id" | "title">;
      events: TableDef<EventRow, "user_id" | "title" | "starts_at" | "ends_at">;
      quizzes: TableDef<QuizRow, "user_id" | "title">;
      questions: TableDef<QuestionRow, "quiz_id" | "position" | "prompt">;
      answers: TableDef<AnswerRow, "question_id" | "position" | "label">;
      quiz_attempts: TableDef<QuizAttemptRow, "quiz_id" | "user_id">;
      attempt_answers: TableDef<AttemptAnswerRow, "attempt_id" | "question_id" | "answer_id">;
      grades: TableDef<GradeRow, "user_id" | "course_id" | "label" | "score">;
      groups: TableDef<GroupRow, "name">;
      group_members: TableDef<GroupMemberRow, "group_id" | "user_id">;
      posts: TableDef<PostRow, "group_id" | "author_id" | "body">;
      comments: TableDef<CommentRow, "post_id" | "author_id" | "body">;
      content_reports: TableDef<ContentReportRow, "reporter_id" | "reason">;
      notifications: TableDef<NotificationRow, "user_id" | "title">;
    };
    Views: { [_ in never]: never };
    Functions: {
      start_quiz_attempt: { Args: { p_quiz_id: string }; Returns: QuizAttemptRow };
      submit_quiz_attempt: { Args: { p_attempt_id: string; p_answer_ids: string[] }; Returns: QuizAttemptRow };
    };
    Enums: {
      app_locale: AppLocale;
      theme_preference: ThemePreference;
      user_role: UserRole;
      academic_level: AcademicLevel;
      task_priority: TaskPriority;
      task_status: TaskStatus;
      event_type: EventType;
      quiz_source: QuizSource;
      attempt_status: AttemptStatus;
      assessment_type: AssessmentType;
      group_visibility: GroupVisibility;
      group_role: GroupRole;
      content_status: ContentStatus;
      report_status: ReportStatus;
      notification_type: NotificationType;
    };
    CompositeTypes: { [_ in never]: never };
  };
};

export const ACADEMIC_LEVELS = [
  "licence_1",
  "licence_2",
  "licence_3",
  "master_1",
  "master_2",
  "prepa_1",
  "prepa_2",
  "ingenieur_1",
  "ingenieur_2",
  "ingenieur_3",
  "doctorat",
  "other",
] as const satisfies readonly AcademicLevel[];
