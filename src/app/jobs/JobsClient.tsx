"use client";

import { useMemo, useState } from "react";
import { ExternalLink, Loader2, MapPin, Radar, Search, Trash2, Plus } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { InterviewerAvatar } from "@/components/interviewer-avatar";
import { Spotlight } from "@/components/spotlight";
import { HeroMark, PageHero } from "@/components/page-hero";
import { SectionHeader } from "@/components/section-header";
import { useLocale } from "@/components/locale-provider";
import { interpolate } from "@/lib/i18n";
import {
  SEARCHABLE_WORK_MODES,
  type JobSearch,
  type JobSearchParams,
  type SearchableWorkMode,
  type WorkMode,
} from "@/lib/jobTypes";

const MODE_STYLES: Record<WorkMode, string> = {
  remote: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  hybrid: "bg-amber-500/20 text-amber-700 dark:text-amber-300",
  onsite: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  unknown: "bg-muted text-muted-foreground",
};

const EMPTY_PARAMS: JobSearchParams = { company: "", role: "", location: "", workModes: [] };

const selectClass =
  "h-9 rounded-md border border-input bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

export default function JobsClient({ initialSearches }: { initialSearches: JobSearch[] }) {
  const { t, locale } = useLocale();
  const [searches, setSearches] = useState(initialSearches);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<JobSearchParams>(EMPTY_PARAMS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modeFilter, setModeFilter] = useState<WorkMode | "all">("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [textFilter, setTextFilter] = useState("");

  const selected = searches.find((s) => s.id === selectedId) ?? null;
  const dateLocale = locale === "en" ? "en-US" : "pt-BR";

  function resetFilters() {
    setModeFilter("all");
    setSourceFilter("all");
    setTextFilter("");
  }

  function select(search: JobSearch) {
    setSelectedId(search.id);
    setForm(search.params);
    setError(null);
    resetFilters();
  }

  function startNew() {
    setSelectedId(null);
    setForm(EMPTY_PARAMS);
    setError(null);
    resetFilters();
  }

  function toggleMode(mode: SearchableWorkMode) {
    setForm((f) => ({
      ...f,
      workModes: f.workModes.includes(mode)
        ? f.workModes.filter((m) => m !== mode)
        : [...f.workModes, mode],
    }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(selectedId ? `/api/job-searches/${selectedId}` : "/api/job-searches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t.jobs.searchFailed);
      const search = data as JobSearch;
      setSearches((prev) => [search, ...prev.filter((s) => s.id !== search.id)]);
      setSelectedId(search.id);
      resetFilters();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.jobs.searchFailed);
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: string) {
    const res = await fetch(`/api/job-searches/${id}`, { method: "DELETE" });
    if (!res.ok) return;
    setSearches((prev) => prev.filter((s) => s.id !== id));
    if (selectedId === id) startNew();
  }

  const sources = useMemo(
    () => [...new Set((selected?.listings ?? []).map((l) => l.source))].sort(),
    [selected]
  );

  const visible = useMemo(() => {
    const text = textFilter.trim().toLowerCase();
    return (selected?.listings ?? []).filter(
      (l) =>
        (modeFilter === "all" || l.workMode === modeFilter) &&
        (sourceFilter === "all" || l.source === sourceFilter) &&
        (!text || l.title.toLowerCase().includes(text))
    );
  }, [selected, modeFilter, sourceFilter, textFilter]);

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <PageHero
          pill={t.jobs.heroPill}
          pillIcon={Radar}
          leading={<InterviewerAvatar className="float-y mt-2 hidden size-16 sm:inline-flex" iconClassName="size-8" />}
          title={
            <>
              {t.jobs.heroTitlePre} <HeroMark>{t.jobs.heroTitleMark}</HeroMark>
            </>
          }
          subtitle={t.jobs.subtitle}
        />

        <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
          <aside className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium">{t.jobs.savedSearches}</h2>
              <Button variant="ghost" size="sm" onClick={startNew}>
                <Plus className="size-3.5" />
                {t.jobs.newSearch}
              </Button>
            </div>
            {searches.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t.jobs.noSavedSearches}</p>
            ) : (
              <ul className="space-y-2">
                {searches.map((s) => (
                  <li key={s.id}>
                    <div
                      className={`flex items-start gap-2 rounded-lg border p-3 transition-colors duration-150 ${
                        s.id === selectedId ? "border-primary bg-accent/40" : "hover:border-primary/40"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => select(s)}
                        className="flex-1 text-left min-w-0"
                      >
                        <div className="text-sm font-medium truncate">{s.params.role}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {s.params.company}
                          {s.params.location ? ` · ${s.params.location}` : ""}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {interpolate(t.jobs.listingCount, { count: s.listings.length })}
                        </div>
                      </button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={t.jobs.delete}
                        onClick={() => remove(s.id)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </aside>

          <section className="space-y-6 min-w-0">
            <Card>
              <CardHeader>
                <SectionHeader icon={Search} tone="sky" title={t.jobs.formTitle} />
              </CardHeader>
              <CardContent>
                <form onSubmit={submit} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="job-company">{t.jobs.company}</Label>
                      <Input
                        id="job-company"
                        value={form.company}
                        onChange={(e) => setForm({ ...form, company: e.target.value })}
                        placeholder={t.jobs.companyPlaceholder}
                        maxLength={120}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="job-role">{t.jobs.role}</Label>
                      <Input
                        id="job-role"
                        value={form.role}
                        onChange={(e) => setForm({ ...form, role: e.target.value })}
                        placeholder={t.jobs.rolePlaceholder}
                        maxLength={120}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="job-location">{t.jobs.location}</Label>
                      <Input
                        id="job-location"
                        value={form.location}
                        onChange={(e) => setForm({ ...form, location: e.target.value })}
                        placeholder={t.jobs.locationPlaceholder}
                        maxLength={120}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{t.jobs.workModeLabel}</Label>
                    <div className="flex flex-wrap gap-3">
                      {SEARCHABLE_WORK_MODES.map((mode) => (
                        <label
                          key={mode}
                          className="flex items-center gap-2 text-sm rounded-md border px-3 py-2 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-accent/40 transition-colors"
                        >
                          <Checkbox
                            checked={form.workModes.includes(mode)}
                            onCheckedChange={() => toggleMode(mode)}
                          />
                          {t.jobs.workMode[mode]}
                        </label>
                      ))}
                    </div>
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button type="submit" disabled={loading} size="lg" className="h-11 rounded-full px-6 text-base">
                    {loading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Search className="size-4" />
                    )}
                    {loading ? t.jobs.searching : selected ? t.jobs.searchAgain : t.jobs.search}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {loading ? (
              <div className="space-y-3" aria-busy="true">
                {[0, 1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="space-y-2.5">
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-3.5 w-1/3" />
                      <Skeleton className="h-5 w-40" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : selected ? (
              <div className="fade-in-fast space-y-4">
                <p className="text-xs text-muted-foreground">
                  {interpolate(t.jobs.searchedAt, {
                    date: new Date(selected.searchedAt).toLocaleString(dateLocale),
                  })}
                </p>

                {selected.notes.atsBoards.length > 0 ? (
                  <Alert>
                    <AlertDescription>
                      {interpolate(t.jobs.atsFound, { boards: selected.notes.atsBoards.join(", ") })}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert>
                    <AlertDescription>{t.jobs.atsNotFound}</AlertDescription>
                  </Alert>
                )}
                {selected.notes.webStatus === "no-key" && (
                  <Alert>
                    <AlertDescription>{t.jobs.webNoKey}</AlertDescription>
                  </Alert>
                )}
                {selected.notes.webStatus === "error" && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      {interpolate(t.jobs.webError, { error: selected.notes.webError ?? "" })}
                    </AlertDescription>
                  </Alert>
                )}

                {selected.listings.length > 0 && (
                  <div className="flex flex-wrap items-center gap-3">
                    <select
                      aria-label={t.jobs.filterWorkMode}
                      className={selectClass}
                      value={modeFilter}
                      onChange={(e) => setModeFilter(e.target.value as WorkMode | "all")}
                    >
                      <option value="all">
                        {t.jobs.filterWorkMode}: {t.jobs.filterAll}
                      </option>
                      {(["remote", "hybrid", "onsite", "unknown"] as const).map((m) => (
                        <option key={m} value={m}>
                          {t.jobs.workMode[m]}
                        </option>
                      ))}
                    </select>
                    <select
                      aria-label={t.jobs.filterSource}
                      className={selectClass}
                      value={sourceFilter}
                      onChange={(e) => setSourceFilter(e.target.value)}
                    >
                      <option value="all">
                        {t.jobs.filterSource}: {t.jobs.filterAll}
                      </option>
                      {sources.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <Input
                      value={textFilter}
                      onChange={(e) => setTextFilter(e.target.value)}
                      placeholder={t.jobs.filterText}
                      className="w-56"
                    />
                    <span className="text-sm text-muted-foreground ml-auto">
                      {interpolate(t.jobs.showing, {
                        shown: visible.length,
                        total: selected.listings.length,
                      })}
                    </span>
                  </div>
                )}

                {selected.listings.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t.jobs.noResults}</p>
                ) : visible.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t.jobs.noMatchFilters}</p>
                ) : (
                  <ul key={`${selected.id}-${selected.searchedAt}`} className="stagger space-y-3">
                    {visible.map((l) => (
                      <li key={l.id}>
                        <Spotlight>
                        <Card className="rounded-2xl transition-[border-color,box-shadow] duration-200 ease-[var(--ease-out-strong)] hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10">
                          <CardContent className="flex items-start justify-between gap-4">
                            <div className="min-w-0 space-y-1.5">
                              <div className="font-medium leading-snug">{l.title}</div>
                              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                <span>{l.company}</span>
                                {l.location && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="size-3.5" />
                                    {l.location}
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <Badge variant="secondary" className={MODE_STYLES[l.workMode]}>
                                  {t.jobs.workMode[l.workMode]}
                                </Badge>
                                <Badge variant="outline">{l.source}</Badge>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              nativeButton={false}
                              render={<a href={l.url} target="_blank" rel="noopener noreferrer" />}
                            >
                              <ExternalLink className="size-3.5" />
                              {t.jobs.openListing}
                            </Button>
                          </CardContent>
                        </Card>
                        </Spotlight>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <div className="rise-in flex flex-col items-center gap-3 rounded-2xl border border-dashed py-14 text-center">
                <InterviewerAvatar className="float-y size-14" iconClassName="size-7" />
                <p className="max-w-sm text-muted-foreground">{t.jobs.emptyState}</p>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
