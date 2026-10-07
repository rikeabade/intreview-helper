"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Plus, Trash2 } from "lucide-react";
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

const roleKey = (r: TargetRoleMeta) => `${r.companySlug}/${r.roleSlug}`;

export default function HomeClient({ roles: initialRoles }: { roles: TargetRoleMeta[] }) {
  const { t } = useLocale();
  const router = useRouter();
  const [roles, setRoles] = useState(initialRoles);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Foca em "Cancelar" ao abrir a confirmação (a ação segura é a padrão) e fecha com Esc.
  useEffect(() => {
    if (!confirming) return;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !deleting) setConfirming(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirming, deleting]);

  async function removeRole(r: TargetRoleMeta) {
    const key = roleKey(r);
    setDeleting(key);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/target-roles/${r.companySlug}/${r.roleSlug}`, {
        method: "DELETE",
      });
      if (!res.ok && res.status !== 404) throw new Error("delete failed");
      setRoles((prev) => prev.filter((x) => roleKey(x) !== key));
      setConfirming(null);
      router.refresh();
    } catch {
      setDeleteError(t.home.deleteFailed);
    } finally {
      setDeleting(null);
    }
  }

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
                <Spotlight key={roleKey(r)}>
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
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-3 bottom-3 z-10 text-muted-foreground hover:text-destructive"
                    aria-label={`${t.home.deleteRole}: ${r.roleTitle} · ${r.companyName}`}
                    title={t.home.deleteRole}
                    onClick={() => {
                      setDeleteError(null);
                      setConfirming(roleKey(r));
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                  {confirming === roleKey(r) && (
                    <div
                      role="alertdialog"
                      aria-labelledby={`del-title-${roleKey(r)}`}
                      aria-describedby={`del-body-${roleKey(r)}`}
                      className="fade-in-fast absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-2xl border border-destructive/30 bg-card/95 p-5 text-center backdrop-blur-sm"
                    >
                      <div id={`del-title-${roleKey(r)}`} className="font-semibold">
                        {t.home.deleteTitle}
                      </div>
                      <p id={`del-body-${roleKey(r)}`} className="text-sm text-muted-foreground">
                        {t.home.deleteBody}
                      </p>
                      {deleteError && (
                        <p role="alert" className="text-sm text-destructive">
                          {deleteError}
                        </p>
                      )}
                      <div className="flex gap-2">
                        <Button
                          ref={cancelRef}
                          variant="outline"
                          size="sm"
                          disabled={deleting === roleKey(r)}
                          onClick={() => setConfirming(null)}
                        >
                          {t.common.cancel}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={deleting === roleKey(r)}
                          onClick={() => removeRole(r)}
                        >
                          {deleting === roleKey(r) ? (
                            <>
                              <Loader2 className="size-4 animate-spin" />
                              {t.home.deleting}
                            </>
                          ) : (
                            t.home.deleteConfirm
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </Spotlight>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
