import {
  BookOpen,
  Bot,
  CalendarDays,
  ClipboardCheck,
  FileText,
  GraduationCap,
  LayoutDashboard,
  ListTodo,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export type NavItem = {
  key: keyof Dictionary["nav"];
  /** Path without locale prefix. */
  href: string;
  icon: LucideIcon;
  /** "soon" items are shown as non-interactive until their module ships. */
  status: "available" | "soon";
};

export const workspaceNav: NavItem[] = [
  { key: "dashboard", href: "/dashboard", icon: LayoutDashboard, status: "available" },
  { key: "courses", href: "/courses", icon: BookOpen, status: "soon" },
  { key: "materials", href: "/materials", icon: FileText, status: "soon" },
  { key: "tasks", href: "/tasks", icon: ListTodo, status: "soon" },
  { key: "calendar", href: "/calendar", icon: CalendarDays, status: "soon" },
  { key: "exams", href: "/exams", icon: ClipboardCheck, status: "soon" },
  { key: "grades", href: "/grades", icon: GraduationCap, status: "soon" },
  { key: "assistant", href: "/assistant", icon: Bot, status: "soon" },
  { key: "community", href: "/community", icon: Users, status: "soon" },
];

export const accountNav: NavItem[] = [{ key: "settings", href: "/settings", icon: Settings, status: "available" }];
