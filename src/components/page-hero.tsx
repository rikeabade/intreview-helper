import type { LucideIcon } from "lucide-react";

export function HeroMark({ children }: { children: React.ReactNode }) {
  return (
    <span className="whitespace-nowrap rounded-xl bg-primary/15 px-2 text-primary">{children}</span>
  );
}

export function PageHero({
  pill,
  pillIcon: PillIcon,
  title,
  subtitle,
  leading,
  actions,
}: {
  pill: React.ReactNode;
  pillIcon: LucideIcon;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  leading?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="rise-in flex items-start gap-5 pb-8">
      {leading}
      <div className="min-w-0 space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1.5 text-sm font-medium text-primary">
          <PillIcon className="size-4" />
          {pill}
        </div>
        <h1 className="text-3xl font-semibold leading-[1.1] tracking-tight sm:text-4xl lg:text-5xl">
          {title}
        </h1>
        {subtitle && <p className="max-w-2xl text-lg text-muted-foreground">{subtitle}</p>}
        {actions && <div className="flex flex-wrap items-center gap-3 pt-1">{actions}</div>}
      </div>
    </div>
  );
}
