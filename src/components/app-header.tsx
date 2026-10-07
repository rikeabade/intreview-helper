import Link from "next/link";
import { Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { LocaleToggle } from "@/components/locale-toggle";
import { JobsNavLink } from "@/components/jobs-nav-link";

export function AppHeader({ children }: { children?: React.ReactNode }) {
  return (
    <header className="border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
      <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="size-4" />
          </span>
          Intreview
        </Link>
        <div className="flex items-center gap-2">
          {children}
          <JobsNavLink />
          <LocaleToggle />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
