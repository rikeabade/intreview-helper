import type { LucideIcon } from "lucide-react";
import { cn } from "cn";

export const TONES = {
  indigo: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-300",
  violet: "bg-violet-500/15 text-violet-600 dark:text-violet-300",
  sky: "bg-sky-500/15 text-sky-600 dark:text-sky-300",
  pink: "bg-pink-500/15 text-pink-600 dark:text-pink-300",
  amber: "bg-amber-500/20 text-amber-600 dark:text-amber-300",
  emerald: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
} as const;

export type Tone = keyof typeof TONES;

export function IconTile({
  icon: Icon,
  tone = "indigo",
  className,
}: {
  icon: LucideIcon;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-xl",
        TONES[tone],
        className
      )}
    >
      <Icon className="size-5" />
    </span>
  );
}

export function SectionHeader({
  icon,
  tone,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  tone?: Tone;
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <IconTile icon={icon} tone={tone} />
      <div className="min-w-0 flex-1">
        <div className="text-base font-semibold leading-tight">{title}</div>
        {description && <div className="mt-0.5 text-sm text-muted-foreground">{description}</div>}
      </div>
      {children}
    </div>
  );
}
