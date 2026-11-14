import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("size-8", className)}>
      <rect width="32" height="32" rx="8" fill="#4F46E5" />
      <path d="M9 12.5 16 9l7 3.5-7 3.5-7-3.5Z" fill="#fff" />
      <path d="M11.5 15.2v4.3c0 1.4 2 2.5 4.5 2.5s4.5-1.1 4.5-2.5v-4.3L16 17.5l-4.5-2.3Z" fill="#C7D2FE" />
    </svg>
  );
}

export function Logo({ href, label = "CampusFlow", className }: { href: string; label?: string; className?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5 rounded-lg", className)}>
      <LogoMark />
      <span className="text-[15px] font-semibold tracking-tight text-foreground" dir="ltr">
        {label}
      </span>
    </Link>
  );
}
