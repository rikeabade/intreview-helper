"use client";

import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import type { TargetRoleMeta } from "@/lib/targetRole";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CompanyTile } from "@/components/company-tile";
import { HomeHero } from "@/components/home-hero";
import { InterviewerAvatar } from "@/components/interviewer-avatar";
import { Spotlight } from "@/components/spotlight";
import { useLocale } from "@/components/locale-provider";
import { interpolate } from "@/lib/i18n";

export default function HomeClient({ roles }: { roles: TargetRoleMeta[] }) {
  const { t } = useLocale();

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <HomeHero />

        {roles.length === 0 ? (
          <Card className="rise-in border-dashed shadow-none">
            <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
              <InterviewerAvatar className="float-y size-16" iconClassName="size-8" pulse />
              <h2 className="mt-2 text-xl font-semibold">{t.home.emptyTitle}</h2>
              <p className="max-w-md text-muted-foreground">{t.home.emptyBody}</p>
              <Button
                render={<Link href="/roles/new" />}
                nativeButton={false}
                size="lg"
                className="mt-2 h-11 rounded-full px-6 text-base"
              >
                <Plus className="size-5" />
                {t.home.createFirst}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-5">
            <div className="rise-in flex items-baseline justify-between gap-3">
              <h2 className="text-2xl font-semibold tracking-tight">{t.home.yourRoles}</h2>
              <span className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground">
                {interpolate(t.home.rolesCount, { count: roles.length })}
              </span>
            </div>
            <div className="stagger grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {roles.map((r) => (
                <Spotlight key={`${r.companySlug}/${r.roleSlug}`}>
                  <Link
                    href={`/roles/${r.companySlug}/${r.roleSlug}`}
                    className="group block h-full rounded-2xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <Card className="h-full rounded-2xl transition-[border-color,box-shadow,translate] duration-200 ease-[var(--ease-out-strong)] group-hover:-translate-y-1 group-hover:shadow-xl group-hover:shadow-primary/10 group-active:translate-y-0">
                      <CardContent className="flex h-full flex-col gap-5 p-1">
                        <div className="flex items-start justify-between gap-3">
                          <CompanyTile name={r.companyName} slug={r.companySlug} />
                          {r.companyType === "consultancy" && (
                            <Badge variant="secondary">{t.home.consultancy}</Badge>
                          )}
                        </div>
                        <div className="space-y-1">
                          <div className="text-lg font-semibold leading-snug">{r.roleTitle}</div>
                          <div className="text-sm text-muted-foreground">
                            {r.companyName}
                            {r.clientName ? ` · ${r.clientName}` : ""}
                          </div>
                        </div>
                        <div className="mt-auto flex items-center gap-1.5 text-sm font-medium text-primary">
                          {t.home.practice}
                          <ArrowRight className="size-4 transition-[translate] duration-200 ease-[var(--ease-out-strong)] group-hover:translate-x-1" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </Spotlight>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
