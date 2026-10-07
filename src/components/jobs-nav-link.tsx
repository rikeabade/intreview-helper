"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/locale-provider";

export function JobsNavLink() {
  const { t } = useLocale();
  return (
    <Button variant="ghost" size="sm" render={<Link href="/jobs" />} nativeButton={false}>
      <Search className="size-3.5" />
      {t.jobs.navLabel}
    </Button>
  );
}
