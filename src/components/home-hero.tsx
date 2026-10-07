"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Hand, Heart, Plus, Search, Send, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InterviewerAvatar } from "@/components/interviewer-avatar";
import { useLocale } from "@/components/locale-provider";

function useCyclingIndex(length: number) {
  const [index, setIndex] = useState(0);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    let swap: ReturnType<typeof setTimeout>;
    const interval = setInterval(() => {
      setTyping(true);
      swap = setTimeout(() => {
        setIndex((i) => (i + 1) % length);
        setTyping(false);
      }, 900);
    }, 5200);
    return () => {
      clearInterval(interval);
      clearTimeout(swap);
    };
  }, [length]);

  return { index, typing };
}

export function HomeHero() {
  const { t, mounted } = useLocale();
  const questions = t.home.sampleQuestions;
  const { index, typing } = useCyclingIndex(questions.length);
  const [hour, setHour] = useState<number | null>(null);

  useEffect(() => {
    setHour(new Date().getHours());
  }, []);

  const greeting =
    hour === null || !mounted
      ? t.home.greetingDefault
      : hour < 12
        ? t.home.greetingMorning
        : hour < 18
          ? t.home.greetingAfternoon
          : t.home.greetingEvening;

  return (
    <section className="grid items-center gap-10 pb-12 pt-4 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
      <div className="stagger space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1.5 text-sm font-medium text-primary">
          <Hand className="wave-hand size-4" />
          {greeting}
        </div>

        <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
          {t.home.heroTitlePre}{" "}
          <span className="relative whitespace-nowrap rounded-xl bg-primary/15 px-2 text-primary">
            {t.home.heroTitleMark}
          </span>
          {t.home.heroTitlePost}
        </h1>

        <p className="max-w-xl text-lg text-muted-foreground">{t.home.heroSubtitle}</p>

        <div className="flex flex-wrap gap-3 pt-1">
          <Button
            render={<Link href="/roles/new" />}
            nativeButton={false}
            size="lg"
            className="h-11 rounded-full px-6 text-base"
          >
            <Plus className="size-5" />
            {t.home.newRole}
          </Button>
          <Button
            render={<Link href="/jobs" />}
            nativeButton={false}
            variant="outline"
            size="lg"
            className="h-11 rounded-full px-6 text-base"
          >
            <Search className="size-5" />
            {t.jobs.navLabel}
          </Button>
        </div>

        <ul className="flex flex-wrap gap-2.5 pt-2">
          <li className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-sm font-medium text-emerald-700 dark:text-emerald-300">
            <ShieldCheck className="size-4" />
            {t.home.chipLocal}
          </li>
          <li className="inline-flex items-center gap-1.5 rounded-full bg-pink-500/15 px-3 py-1 text-sm font-medium text-pink-700 dark:text-pink-300">
            <Heart className="size-4" />
            {t.home.chipFree}
          </li>
          <li className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-3 py-1 text-sm font-medium text-amber-700 dark:text-amber-300">
            <Sparkles className="size-4" />
            {t.home.chipAdaptive}
          </li>
        </ul>
      </div>

      <div aria-hidden="true" className="rise-in relative mx-auto w-full max-w-md">
        <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-gradient-to-br from-primary/25 via-violet-400/20 to-pink-400/20 blur-2xl" />
        <div className="float-y rounded-3xl border bg-card/90 p-5 shadow-xl shadow-primary/10 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <InterviewerAvatar className="size-12" iconClassName="size-6" pulse />
            <div className="leading-tight">
              <div className="font-medium">{t.home.interviewerLabel}</div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <span className="size-2 rounded-full bg-emerald-500" />
                {t.home.interviewerReady}
              </div>
            </div>
          </div>

          <div className="mt-5 min-h-28">
            {typing ? (
              <div className="bubble-in inline-flex gap-1.5 rounded-2xl rounded-tl-sm bg-muted px-4 py-3.5">
                <span className="typing-dot size-2 rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                <span className="typing-dot size-2 rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                <span className="typing-dot size-2 rounded-full bg-muted-foreground" />
              </div>
            ) : (
              <div
                key={index}
                className="bubble-in rounded-2xl rounded-tl-sm bg-muted px-4 py-3 text-base leading-relaxed"
              >
                {questions[index]}
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-2xl border bg-background px-4 py-2.5 text-sm text-muted-foreground">
            <span className="flex-1">{t.session.answerPlaceholder}</span>
            <span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Send className="size-4" />
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
