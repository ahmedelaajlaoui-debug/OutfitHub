import {
  ArrowRight,
  BookOpen,
  Bot,
  CalendarDays,
  ClipboardCheck,
  FileText,
  GraduationCap,
  KeyRound,
  ListTodo,
  LockKeyhole,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { LogoMark } from "@/components/layout/logo";
import { ButtonLink } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { localizedPath } from "@/lib/routes";
import { DashboardPreview } from "./dashboard-preview";

type SectionProps = { locale: Locale; t: Dictionary };

export function Hero({ locale, t }: SectionProps) {
  const h = t.landing.hero;
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-14 pb-16 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pt-20 lg:pb-24">
      <div>
        <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-soft px-3 py-1 text-xs font-medium text-primary-soft-foreground">
          <span className="size-1.5 rounded-full bg-primary" aria-hidden />
          {h.eyebrow}
        </p>
        <h1 className="mt-5 text-4xl leading-[1.1] font-semibold tracking-tight text-balance sm:text-5xl">{h.title}</h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">{h.subtitle}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href={localizedPath(locale, "/register")} size="lg">
            {h.primaryCta}
            <ArrowRight className="size-4 rtl:-scale-x-100" aria-hidden />
          </ButtonLink>
          <ButtonLink href={localizedPath(locale, "/login")} size="lg" variant="outline">
            {h.secondaryCta}
          </ButtonLink>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">{h.note}</p>
      </div>
      <DashboardPreview t={t} />
    </section>
  );
}

const featureIcons: Record<keyof Dictionary["landing"]["features"]["items"], LucideIcon> = {
  courses: BookOpen,
  materials: FileText,
  tasks: ListTodo,
  calendar: CalendarDays,
  exams: ClipboardCheck,
  grades: GraduationCap,
  assistant: Bot,
  community: Users,
};

export function Features({ t }: { t: Dictionary }) {
  const f = t.landing.features;
  const keys = Object.keys(featureIcons) as (keyof typeof featureIcons)[];
  return (
    <section id="features" className="scroll-mt-20 border-y border-border bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight">{f.title}</h2>
          <p className="mt-3 text-muted-foreground">{f.subtitle}</p>
        </div>
        <ul className="mt-12 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {keys.map((key) => {
            const Icon = featureIcons[key];
            return (
              <li key={key} className="bg-surface p-6">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary-soft text-primary">
                  <Icon className="size-[18px]" aria-hidden />
                </div>
                <h3 className="mt-4 font-semibold">{f.items[key].title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.items[key].description}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

export function Steps({ t }: { t: Dictionary }) {
  const s = t.landing.steps;
  const steps = [s.items.one, s.items.two, s.items.three];
  return (
    <section id="how-it-works" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
      <h2 className="text-3xl font-semibold tracking-tight">{s.title}</h2>
      <ol className="mt-10 grid gap-6 md:grid-cols-3">
        {steps.map((step, index) => (
          <li key={step.title} className="rounded-xl border border-border bg-surface p-6 shadow-card">
            <span className="inline-flex size-8 items-center justify-center rounded-full bg-foreground text-sm font-semibold text-background">
              {index + 1}
            </span>
            <h3 className="mt-4 font-semibold">{step.title}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{step.description}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function Security({ t }: { t: Dictionary }) {
  const s = t.landing.security;
  const items = [
    { icon: ShieldCheck, label: s.items.rls },
    { icon: LockKeyhole, label: s.items.storage },
    { icon: KeyRound, label: s.items.secrets },
  ];
  return (
    <section id="security" className="scroll-mt-20 border-y border-border bg-surface">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">{s.title}</h2>
          <p className="mt-3 text-muted-foreground">{s.subtitle}</p>
        </div>
        <ul className="space-y-3">
          {items.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3.5">
              <Icon className="size-5 shrink-0 text-success" aria-hidden />
              <span className="text-sm font-medium">{label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function FinalCta({ locale, t }: SectionProps) {
  const c = t.landing.cta;
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="flex flex-col items-start justify-between gap-6 rounded-2xl border border-transparent bg-panel px-6 py-10 text-panel-foreground dark:border-border sm:px-10 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{c.title}</h2>
          <p className="mt-2 opacity-75">{c.subtitle}</p>
        </div>
        <ButtonLink href={localizedPath(locale, "/register")} size="lg" className="shrink-0">
          {c.button}
          <ArrowRight className="size-4 rtl:-scale-x-100" aria-hidden />
        </ButtonLink>
      </div>
    </section>
  );
}

export function SiteFooter({ locale, t }: SectionProps) {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <LogoMark className="size-6" />
          <span>{t.landing.footer.tagline}</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <Link href={localizedPath(locale, "/login")} className="hover:text-foreground">
            {t.landing.nav.login}
          </Link>
          <Link href={localizedPath(locale, "/register")} className="hover:text-foreground">
            {t.landing.nav.register}
          </Link>
          <span>
            © <span dir="ltr">CampusFlow</span>. {t.landing.footer.rights}
          </span>
        </div>
      </div>
    </footer>
  );
}
