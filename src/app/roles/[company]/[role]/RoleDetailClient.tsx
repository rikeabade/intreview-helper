"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Search, RefreshCw, Play, FileText, FileUser, User, ClipboardCopy, Plus, X, Check, Circle, ClipboardList, BookOpen, MessagesSquare, Sparkles, Loader2 } from "lucide-react";
import type { TargetRoleDetail } from "@/lib/targetRole";
import { getPhases } from "@/lib/phases";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EditableTextCard } from "@/components/editable-text-card";
import { CompanyTile } from "@/components/company-tile";
import { PageHero } from "@/components/page-hero";
import { SectionHeader } from "@/components/section-header";
import { useLocale } from "@/components/locale-provider";
import type { EditableTargetRoleField } from "@/lib/targetRole";

export default function RoleDetailClient({
  initialDetail,
  company,
  role,
}: {
  initialDetail: TargetRoleDetail;
  company: string;
  role: string;
}) {
  const router = useRouter();
  const { t, locale } = useLocale();
  const phases = getPhases(locale);
  const [detail, setDetail] = useState(initialDetail);
  const [researching, setResearching] = useState(false);
  const [researchError, setResearchError] = useState<string | null>(null);
  const [selectedPhases, setSelectedPhases] = useState<string[]>(phases.map((p) => p.id));
  const [questionsPerPhase, setQuestionsPerPhase] = useState(5);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  // RH Help state
  const [rhAnswers, setRhAnswers] = useState<{ question: string; answer: string }[]>([]);
  const [rhLoading, setRhLoading] = useState(false);
  const [rhError, setRhError] = useState<string | null>(null);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [newCustomQuestion, setNewCustomQuestion] = useState("");

  useEffect(() => {
    fetch(`/api/target-roles/${company}/${role}/rh-help`)
      .then((res) => res.json())
      .then((data) => {
        if (data.answers && Array.isArray(data.answers)) {
          setRhAnswers(data.answers);
        }
      })
      .catch(() => {});
  }, [company, role]);

  async function runResearch() {
    setResearching(true);
    setResearchError(null);
    try {
      const res = await fetch(`/api/target-roles/${company}/${role}/research`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t.roleDetail.searchFailed);
      setDetail((d) => ({ ...d, researchDossier: data.researchDossier }));
    } catch (err) {
      setResearchError(err instanceof Error ? err.message : t.common.somethingWrong);
    } finally {
      setResearching(false);
    }
  }

  async function reloadDossier() {
    const res = await fetch(`/api/target-roles/${company}/${role}`);
    const data = await res.json();
    if (res.ok) setDetail(data);
  }

  async function saveField(field: EditableTargetRoleField, content: string) {
    const res = await fetch(`/api/target-roles/${company}/${role}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ field, content }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? t.common.saveFailed);
    setDetail(data);
  }

  function togglePhase(id: string) {
    setSelectedPhases((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  async function startSession() {
    setStarting(true);
    setStartError(null);
    try {
      const res = await fetch(`/api/target-roles/${company}/${role}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedPhaseIds: selectedPhases, questionsPerPhase, locale }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t.roleDetail.startFailed);
      router.push(`/roles/${company}/${role}/sessions/${data.state.id}`);
    } catch (err) {
      setStartError(err instanceof Error ? err.message : t.common.somethingWrong);
      setStarting(false);
    }
  }

  async function generateRhAnswers() {
    if (!detail.jobDescription || detail.jobDescription.trim().length < 50) {
      setRhError(t.roleDetail.rhHelpJdRequired);
      return;
    }
    setRhLoading(true);
    setRhError(null);
    try {
      const res = await fetch(`/api/target-roles/${company}/${role}/rh-help`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t.roleDetail.rhHelpError);
      setRhAnswers(data.answers ?? []);
    } catch (err) {
      setRhError(err instanceof Error ? err.message : t.roleDetail.rhHelpError);
    } finally {
      setRhLoading(false);
    }
  }

  async function addCustomQuestion() {
    if (!newCustomQuestion.trim()) return;
    if (!detail.jobDescription || detail.jobDescription.trim().length < 50) {
      setRhError(t.roleDetail.rhHelpJdRequired);
      return;
    }
    const question = newCustomQuestion.trim();
    setNewCustomQuestion("");
    setShowCustomInput(false);
    // Generate answer for this custom question
    setRhLoading(true);
    setRhError(null);
    try {
      const res = await fetch(`/api/target-roles/${company}/${role}/rh-help`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale, customQuestions: [question] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t.roleDetail.rhHelpError);
      setRhAnswers(data.answers ?? []);
    } catch (err) {
      setRhError(err instanceof Error ? err.message : t.roleDetail.rhHelpError);
    } finally {
      setRhLoading(false);
    }
  }

  async function copyToClipboard(text: string) {
    await navigator.clipboard.writeText(text);
  }

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="stagger mx-auto max-w-5xl px-6 py-12 space-y-6">
        <PageHero
          pill={t.roleDetail.heroPill}
          pillIcon={Sparkles}
          leading={
            <CompanyTile
              name={detail.meta.companyName}
              slug={detail.meta.companySlug}
              className="mt-2 hidden size-16 text-3xl sm:flex"
            />
          }
          title={detail.meta.roleTitle}
          subtitle={
            <span className="inline-flex flex-wrap items-center gap-2">
              <span>{detail.meta.companyName}</span>
              {detail.meta.companyType === "consultancy" && (
                <Badge variant="secondary">
                  {t.roleDetail.consultancy}
                  {detail.meta.clientName ? ` · ${detail.meta.clientName}` : ""}
                </Badge>
              )}
            </span>
          }
          actions={
            <>
              <Button
                render={<a href="#start" />}
                nativeButton={false}
                size="lg"
                className="h-11 rounded-full px-6 text-base"
              >
                <Play className="size-5" />
                {t.roleDetail.goStart}
              </Button>
              {[
                { label: t.roleDetail.jobDescription, done: detail.jobDescription.trim() !== "" },
                { label: t.roleDetail.cv, done: detail.cv.trim() !== "" },
                { label: t.roleDetail.interviewPurposeTitle, done: !!detail.interviewPurpose?.trim() },
                { label: t.roleDetail.dossierTitle, done: !!detail.researchDossier },
              ].map((chip) => (
                <span
                  key={chip.label}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${
                    chip.done
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {chip.done ? <Check className="size-3.5" /> : <Circle className="size-3.5" />}
                  {chip.label}
                </span>
              ))}
            </>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <SectionHeader icon={FileText} tone="violet" title={t.roleDetail.jobDescription} />
            </CardHeader>
            <CardContent>
              <EditableTextCard
                content={detail.jobDescription}
                onSave={(content) => saveField("jobDescription", content)}
                emptyText={t.roleDetail.jobDescriptionEmpty}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <SectionHeader icon={FileUser} tone="sky" title={t.roleDetail.cv} />
            </CardHeader>
            <CardContent>
              <EditableTextCard
                content={detail.cv}
                onSave={(content) => saveField("cv", content)}
                emptyText={t.roleDetail.cvEmpty}
              />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <SectionHeader
              icon={ClipboardList}
              tone="pink"
              title={t.roleDetail.interviewPurposeTitle}
              description={t.roleDetail.interviewPurposeHint}
            />
          </CardHeader>
          <CardContent>
            <EditableTextCard
              content={detail.interviewPurpose ?? ""}
              onSave={(content) => saveField("interviewPurpose", content)}
              placeholder={t.roleDetail.interviewPurposePlaceholder}
              emptyText={t.roleDetail.interviewPurposeEmpty}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <SectionHeader
              icon={BookOpen}
              tone="amber"
              title={t.roleDetail.dossierTitle}
              description={t.roleDetail.dossierSubtitle}
            >
            <div className="flex gap-2">
                {detail.researchDossier && (
                  <Button variant="outline" size="sm" onClick={reloadDossier}>
                    <RefreshCw className="size-3.5" />
                    {t.roleDetail.reload}
                  </Button>
                )}
                <Button size="sm" onClick={runResearch} disabled={researching}>
                  <Search className="size-3.5" />
                  {researching
                    ? t.roleDetail.searching
                    : detail.researchDossier
                      ? t.roleDetail.searchAgain
                      : t.roleDetail.search}
                </Button>
              </div>
            </SectionHeader>
          </CardHeader>
          <CardContent>
            {researchError && (
              <Alert variant="destructive" className="mb-3">
                <AlertDescription>{researchError}</AlertDescription>
              </Alert>
            )}

            <EditableTextCard
              content={detail.researchDossier ?? ""}
              onSave={(content) => saveField("researchDossier", content)}
              emptyText={t.roleDetail.dossierEmpty}
              markdown
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <SectionHeader
              icon={MessagesSquare}
              tone="emerald"
              title={t.roleDetail.rhHelpTitle}
              description={t.roleDetail.rhHelpSubtitle}
            />
          </CardHeader>
          <CardContent className="space-y-4">
            {rhError && (
              <Alert variant="destructive">
                <AlertDescription>{rhError}</AlertDescription>
              </Alert>
            )}

            {rhAnswers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <User className="size-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">{t.roleDetail.rhHelpEmpty}</p>
                <Button
                  onClick={generateRhAnswers}
                  disabled={rhLoading || !detail.jobDescription || detail.jobDescription.trim().length < 50}
                  className="mt-3"
                >
                  {rhLoading ? (
                    <>
                      <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="4" fill="none" />
                      </svg>
                      {t.roleDetail.rhHelpGenerating}
                    </>
                  ) : (
                    <>
                      <User className="size-3.5 mr-2" />
                      {t.roleDetail.rhHelpGenerate}
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {rhAnswers.map((item, idx) => (
                  <div key={idx} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-sm flex-1">{item.question}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(item.answer)}
                        className="h-8 w-8 p-0"
                      >
                        <ClipboardCopy className="size-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.answer}</p>
                  </div>
                ))}
                <div className="flex items-center gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => setShowCustomInput(true)}>
                    <Plus className="size-3.5 mr-1" />
                    {t.roleDetail.rhHelpCustomQuestion}
                  </Button>
                  {showCustomInput && (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        value={newCustomQuestion}
                        onChange={(e) => setNewCustomQuestion(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addCustomQuestion()}
                        placeholder={t.roleDetail.rhHelpCustomPlaceholder}
                        className="flex-1"
                        autoFocus
                      />
                      <Button size="sm" onClick={addCustomQuestion} disabled={rhLoading || !newCustomQuestion.trim()}>
                        <Check className="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => { setShowCustomInput(false); setNewCustomQuestion(""); }}>
                        <X className="size-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card id="start" className="scroll-mt-24">
          <CardHeader>
            <SectionHeader
              icon={Play}
              tone="indigo"
              title={t.roleDetail.startTitle}
              description={t.roleDetail.startSubtitle}
            />
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              {phases.map((phase) => (
                <label
                  key={phase.id}
                  className="flex items-center gap-2 text-sm rounded-xl border px-3 py-2.5 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-accent/40 transition-colors hover:border-primary/40"
                >
                  <Checkbox
                    checked={selectedPhases.includes(phase.id)}
                    onCheckedChange={() => togglePhase(phase.id)}
                  />
                  {phase.label}
                </label>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="questionsPerPhase" className="text-sm whitespace-nowrap">
                {t.roleDetail.questionsPerPhase}
              </Label>
              <Input
                id="questionsPerPhase"
                type="number"
                min={1}
                max={15}
                value={questionsPerPhase}
                onChange={(e) => setQuestionsPerPhase(Number(e.target.value))}
                className="w-20"
              />
            </div>
            {startError && (
              <Alert variant="destructive">
                <AlertDescription>{startError}</AlertDescription>
              </Alert>
            )}
            <Button
              onClick={startSession}
              disabled={starting || selectedPhases.length === 0}
              size="lg"
              className="h-12 rounded-full px-8 text-base"
            >
              {starting ? <Loader2 className="size-5 animate-spin" /> : <Play className="size-5" />}
              {starting ? t.roleDetail.starting : t.roleDetail.start}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
