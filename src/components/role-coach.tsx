import { Check } from "lucide-react";
import { InterviewerAvatar } from "@/components/interviewer-avatar";
import { cn } from "cn";

export function RoleCoach({
  name,
  tip,
  title,
  steps,
  doneText,
}: {
  name: string;
  tip: string;
  title: string;
  steps: { label: string; done: boolean }[];
  doneText: string;
}) {
  const doneCount = steps.filter((s) => s.done).length;
  const pct = Math.round((doneCount / steps.length) * 100);

  return (
    <div className="relative">
      <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-br from-primary/20 via-violet-400/15 to-pink-400/15 blur-2xl" />
      <div className="space-y-5 rounded-3xl border bg-card/90 p-5 shadow-xl shadow-primary/10 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <InterviewerAvatar className="float-y size-12" iconClassName="size-6" pulse />
          <div className="font-medium">{name}</div>
        </div>

        <div
          key={tip}
          className="bubble-in rounded-2xl rounded-tl-sm bg-muted px-4 py-3 leading-relaxed"
          aria-live="polite"
        >
          {tip}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{title}</span>
            <span className="tabular-nums text-muted-foreground">
              {doneCount}/{steps.length}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-violet-500 transition-[width] duration-500 ease-[var(--ease-out-strong)]"
              style={{ width: `${pct}%` }}
            />
          </div>
          <ul className="space-y-2">
            {steps.map((s) => (
              <li key={s.label} className="flex items-center gap-2.5 text-sm">
                <span
                  className={cn(
                    "flex size-5 items-center justify-center rounded-full border transition-[background-color,border-color,scale] duration-300 ease-[var(--ease-out-strong)]",
                    s.done
                      ? "scale-110 border-emerald-500 bg-emerald-500 text-white"
                      : "border-border text-transparent"
                  )}
                >
                  <Check className="size-3" />
                </span>
                <span className={s.done ? "text-foreground" : "text-muted-foreground"}>
                  {s.label}
                </span>
              </li>
            ))}
          </ul>
          {doneCount === steps.length && (
            <p className="bubble-in rounded-xl bg-emerald-500/15 px-3 py-2 text-sm font-medium text-emerald-700 dark:text-emerald-300">
              {doneText}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
