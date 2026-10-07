import { Sparkles } from "lucide-react";
import { cn } from "cn";

export function InterviewerAvatar({
  className,
  iconClassName,
  pulse = false,
}: {
  className?: string;
  iconClassName?: string;
  pulse?: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-violet-500 text-primary-foreground shadow-md shadow-primary/30 ring-2 ring-background",
        pulse && "pulse-ring",
        className
      )}
    >
      <Sparkles className={cn("size-4", iconClassName)} />
    </span>
  );
}
