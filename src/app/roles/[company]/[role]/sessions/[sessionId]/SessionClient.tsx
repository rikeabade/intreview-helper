"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { SafeMarkdown } from "@/components/safe-markdown";
import { Send, Square, ArrowRight, FileText, FileUser, Lightbulb, PartyPopper, Check } from "lucide-react";
import type { SessionState } from "@/lib/interview";
import { getPhases } from "@/lib/phases";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { InterviewerAvatar } from "@/components/interviewer-avatar";
import { Confetti } from "@/components/confetti";
import { SectionHeader } from "@/components/section-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLocale } from "@/components/locale-provider";
import { interpolate } from "@/lib/i18n";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

async function postAction(
  company: string,
  role: string,
  sessionId: string,
  action: string,
  payload: Record<string, unknown> = {},
  fallbackError = "Something went wrong. Try again."
) {
  const res = await fetch(`/api/target-roles/${company}/${role}/sessions/${sessionId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...payload }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? fallbackError);
  return data;
}

function InterviewerBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rise-in">
      <InterviewerAvatar className="size-9" />
      <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-muted px-4 py-3 text-[0.95rem] leading-relaxed shadow-sm">
        {children}
      </div>
    </div>
  );
}

function CandidateBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-end rise-in">
      <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tr-sm bg-gradient-to-br from-primary to-violet-500 px-4 py-3 text-[0.95rem] leading-relaxed text-primary-foreground shadow-md shadow-primary/20">
        {children}
      </div>
    </div>
  );
}

function ThinkingBubble() {
  return (
    <div className="flex items-start gap-3">
      <InterviewerAvatar className="size-9" pulse />
      <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-3.5 flex gap-1.5 items-center">
        <span className="size-2 rounded-full bg-muted-foreground typing-dot [animation-delay:-0.3s]" />
        <span className="size-2 rounded-full bg-muted-foreground typing-dot [animation-delay:-0.15s]" />
        <span className="size-2 rounded-full bg-muted-foreground typing-dot" />
      </div>
    </div>
  );
}

export default function SessionClient({
  initialState,
  jobDescription,
  cv,
  company,
  role,
}: {
  initialState: SessionState;
  jobDescription: string;
  cv: string;
  company: string;
  role: string;
}) {
  const { resolvedTheme } = useTheme();
  const { t, locale } = useLocale();
  const phases = getPhases(locale);
  const [state, setState] = useState(initialState);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [awaitingNextPhase, setAwaitingNextPhase] = useState(false);
  const [allPhasesDone, setAllPhasesDone] = useState(false);
  const [reportFilePath, setReportFilePath] = useState<string | null>(null);

  const currentPhaseId = state.selectedPhases[state.currentPhaseIndex];
  const currentPhase = state.phases[currentPhaseId];
  const phaseDef = phases.find((p) => p.id === currentPhaseId)!;
  const isLastPhase = state.currentPhaseIndex === state.selectedPhases.length - 1;
  const progressPct = Math.round(((state.currentPhaseIndex + (awaitingNextPhase || allPhasesDone ? 1 : 0.5)) / state.selectedPhases.length) * 100);

  async function submitAnswer() {
    if (!answer.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await postAction(
        company,
        role,
        state.id,
        "answer",
        { answer },
        t.common.somethingWrong
      );
      setState(data.state);
      setAnswer("");
      if (data.phaseComplete) setAwaitingNextPhase(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.somethingWrong);
    } finally {
      setLoading(false);
    }
  }

  async function endPhase() {
    setLoading(true);
    setError(null);
    try {
      const data = await postAction(company, role, state.id, "end-phase", {}, t.common.somethingWrong);
      setState(data.state);
      setAwaitingNextPhase(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.somethingWrong);
    } finally {
      setLoading(false);
    }
  }

  async function goNextPhase() {
    setLoading(true);
    setError(null);
    try {
      const data = await postAction(company, role, state.id, "next-phase", {}, t.common.somethingWrong);
      if (data.allPhasesDone) {
        setAllPhasesDone(true);
      } else {
        setState(data.state);
        setAwaitingNextPhase(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.somethingWrong);
    } finally {
      setLoading(false);
    }
  }

  async function finishSession() {
    setLoading(true);
    setError(null);
    try {
      const data = await postAction(company, role, state.id, "finish", {}, t.common.somethingWrong);
      setState(data.state);
      setReportFilePath(data.filePath);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.somethingWrong);
    } finally {
      setLoading(false);
    }
  }

  if (state.finished && state.report) {
    return (
      <div className="min-h-screen">
        <AppHeader />
        <main className="stagger relative mx-auto max-w-3xl px-6 py-14 space-y-4">
          <Confetti />
          <div className="text-center space-y-1">
            <div className="float-y mx-auto mb-3 flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-pink-400 text-white shadow-lg shadow-pink-400/30">
              <PartyPopper className="size-8" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">{t.session.greatInterview}</h1>
            {reportFilePath && (
              <p className="text-sm text-muted-foreground">
                {t.session.savedAt}{" "}
                <code className="bg-muted px-1 py-0.5 rounded text-xs">{reportFilePath}</code>
              </p>
            )}
          </div>
          <Card>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none pt-6">
              <SafeMarkdown>{state.report}</SafeMarkdown>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />

      <div className="border-b bg-muted/30">
        <div className="mx-auto max-w-6xl space-y-3 px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <ol className="flex flex-wrap items-center gap-2">
              {state.selectedPhases.map((id, i) => {
                const def = phases.find((p) => p.id === id);
                const done = i < state.currentPhaseIndex || (i === state.currentPhaseIndex && (awaitingNextPhase || allPhasesDone));
                const current = i === state.currentPhaseIndex && !done;
                return (
                  <li
                    key={id}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium transition-colors duration-300 ${
                      done
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                        : current
                          ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                          : "bg-muted text-muted-foreground"
                    }`}
                    aria-current={current ? "step" : undefined}
                  >
                    {done && <Check className="size-3.5" />}
                    {def?.label ?? id}
                  </li>
                );
              })}
            </ol>
            <span className="text-sm text-muted-foreground">
              {interpolate(t.session.phaseOf, {
                current: state.currentPhaseIndex + 1,
                total: state.selectedPhases.length,
              })}
            </span>
          </div>
          <Progress value={progressPct} className="h-2" />
        </div>
      </div>

      <main className="mx-auto max-w-6xl w-full px-6 py-6 grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
        <aside className="order-2 space-y-4 md:order-1 md:col-span-1 md:sticky md:top-20 md:self-start">
          <Card>
            <CardHeader className="py-3">
              <SectionHeader icon={FileText} tone="violet" title={t.roleDetail.jobDescription} />
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground max-h-48 overflow-y-auto whitespace-pre-wrap">
                {jobDescription}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="py-3">
              <SectionHeader icon={FileUser} tone="sky" title={t.roleDetail.cv} />
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground max-h-48 overflow-y-auto whitespace-pre-wrap">
                {cv}
              </div>
            </CardContent>
          </Card>
        </aside>

        <section className="order-1 flex min-w-0 flex-col gap-4 md:order-2 md:col-span-2">
          <div className="space-y-4 flex-1">
            {currentPhase.entries.map((entry, i) => (
              <div key={i} className="space-y-3">
                <InterviewerBubble>{entry.question}</InterviewerBubble>
                <CandidateBubble>{entry.answer}</CandidateBubble>
                {entry.feedback && entry.feedback !== "N/A" && (
                  <div className="ml-11 flex items-start gap-2 rounded-lg bg-accent/40 px-3 py-2 text-sm text-foreground/85">
                    <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-primary" />
                    <p>{entry.feedback}</p>
                  </div>
                )}
              </div>
            ))}

            {allPhasesDone ? (
              <Card className="rise-in relative border-primary/30 bg-primary/5">
                <Confetti count={28} />
                <CardContent className="py-6 space-y-3 text-center">
                  <p className="text-sm font-medium">{t.session.allPhasesDone}</p>
                  <Button onClick={finishSession} disabled={loading} size="lg">
                    {loading ? t.session.generatingReport : t.session.generateReport}
                    {!loading && <ArrowRight className="size-4" />}
                  </Button>
                </CardContent>
              </Card>
            ) : awaitingNextPhase ? (
              <Card className="rise-in relative border-primary/30 bg-primary/5">
                <Confetti count={28} />
                <CardContent className="py-6 space-y-3 text-center">
                  <p className="text-sm font-medium">{t.session.phaseComplete}</p>
                  <Button onClick={goNextPhase} disabled={loading} size="lg">
                    {loading
                      ? t.session.loading
                      : isLastPhase
                        ? t.session.finishInterview
                        : t.session.nextPhase}
                    {!loading && <ArrowRight className="size-4" />}
                  </Button>
                </CardContent>
              </Card>
            ) : currentPhase.pendingQuestion ? (
              <InterviewerBubble>{currentPhase.pendingQuestion}</InterviewerBubble>
            ) : (
              <ThinkingBubble />
            )}

            {loading && !awaitingNextPhase && !allPhasesDone && currentPhase.pendingQuestion && (
              <ThinkingBubble />
            )}
          </div>

          {!allPhasesDone && !awaitingNextPhase && currentPhase.pendingQuestion && (
            <div className="sticky bottom-4 space-y-2 rounded-xl border bg-background/95 p-3 shadow-sm backdrop-blur-sm">
              {currentPhaseId === "live-coding" ? (
                <div className="border rounded-lg overflow-hidden">
                  <MonacoEditor
                    height="280px"
                    language={currentPhase.language ?? "javascript"}
                    value={answer}
                    onChange={(val) => setAnswer(val ?? "")}
                    theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
                    options={{ minimap: { enabled: false }, fontSize: 13 }}
                  />
                </div>
              ) : (
                <Textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder={t.session.answerPlaceholder}
                  className="h-28 bg-background"
                />
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button onClick={submitAnswer} disabled={loading || !answer.trim()}>
                  <Send className="size-4" />
                  {loading ? t.session.sending : t.session.sendAnswer}
                </Button>
                <Button variant="outline" onClick={endPhase} disabled={loading}>
                  <Square className="size-3.5" />
                  {t.session.endPhase}
                </Button>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
