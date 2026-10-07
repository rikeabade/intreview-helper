"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Building2, ClipboardList, FileText, FileUser, Loader2, Sparkles, Upload } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InterviewerAvatar } from "@/components/interviewer-avatar";
import { HeroMark, PageHero } from "@/components/page-hero";
import { SectionHeader } from "@/components/section-header";
import { RoleCoach } from "@/components/role-coach";
import { useLocale } from "@/components/locale-provider";

async function extractTextFromFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/extract-text", { method: "POST", body: formData });
  if (!res.ok) throw new Error("file read failed");
  const data = await res.json();
  return data.text as string;
}

export default function NewRolePage() {
  const router = useRouter();
  const { t } = useLocale();
  const [companyName, setCompanyName] = useState("");
  const [companyType, setCompanyType] = useState<"product" | "consultancy">("product");
  const [clientName, setClientName] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [cv, setCv] = useState("");
  const [interviewPurpose, setInterviewPurpose] = useState("");
  const [focus, setFocus] = useState<"company" | "jd" | "cv" | "purpose">("company");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(kind: "jd" | "cv", file: File | null) {
    if (!file) return;
    try {
      const text = await extractTextFromFile(file);
      if (kind === "jd") setJobDescription(text);
      else setCv(text);
    } catch {
      setError(t.newRole.fileReadError);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/target-roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          companyType,
          clientName: companyType === "consultancy" ? clientName : undefined,
          roleTitle,
          jobDescription,
          cv,
          interviewPurpose: interviewPurpose || undefined,
        }),
      });
      if (!res.ok) throw new Error(t.newRole.createError);
      const data = await res.json();
      router.push(`/roles/${data.meta.companySlug}/${data.meta.roleSlug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.somethingWrong);
      setSubmitting(false);
    }
  }

  const companyDone = companyName.trim() !== "" && roleTitle.trim() !== "";
  const steps = [
    { label: t.newRole.stepCompany, done: companyDone },
    { label: t.newRole.jobDescription, done: jobDescription.trim() !== "" },
    { label: t.newRole.cv, done: cv.trim() !== "" },
  ];
  const allDone = steps.every((st) => st.done);
  const tips = {
    company: t.newRole.tipCompany,
    jd: t.newRole.tipJd,
    cv: t.newRole.tipCv,
    purpose: t.newRole.tipPurpose,
  };
  const tip = allDone && focus === "company" ? t.newRole.tipReady : tips[focus];

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <PageHero
          pill={t.newRole.heroPill}
          pillIcon={Sparkles}
          leading={<InterviewerAvatar className="float-y mt-2 hidden size-16 sm:inline-flex" iconClassName="size-8" />}
          title={
            <>
              {t.newRole.heroTitlePre} <HeroMark>{t.newRole.heroTitleMark}</HeroMark>
              {t.newRole.heroTitlePost}
            </>
          }
          subtitle={t.newRole.subtitle}
        />

        <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
          <form onSubmit={handleSubmit} className="stagger space-y-6">
          <Card onFocusCapture={() => setFocus("company")}>
            <CardHeader>
              <SectionHeader icon={Building2} tone="violet" title={t.newRole.aboutRole} />
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="companyName">{t.newRole.companyName}</Label>
                <Input
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder={t.newRole.companyNamePlaceholder}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="roleTitle">{t.newRole.roleTitle}</Label>
                <Input
                  id="roleTitle"
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                  placeholder={t.newRole.roleTitlePlaceholder}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>{t.newRole.companyType}</Label>
                <RadioGroup
                  value={companyType}
                  onValueChange={(v) => setCompanyType(v as "product" | "consultancy")}
                  className="flex gap-6"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="product" id="type-product" />
                    <Label htmlFor="type-product" className="font-normal cursor-pointer">
                      {t.newRole.product}
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="consultancy" id="type-consultancy" />
                    <Label htmlFor="type-consultancy" className="font-normal cursor-pointer">
                      {t.newRole.consultancy}
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {companyType === "consultancy" && (
                <div className="space-y-2">
                  <Label htmlFor="clientName">{t.newRole.clientName}</Label>
                  <Input
                    id="clientName"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder={t.newRole.clientNamePlaceholder}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card onFocusCapture={() => setFocus("jd")}>
            <CardHeader>
              <SectionHeader icon={FileText} tone="sky" title={t.newRole.jobDescription} description={t.newRole.fileHint} />
            </CardHeader>
            <CardContent className="space-y-3">
              <label className="flex items-center gap-2 text-sm text-muted-foreground border border-dashed rounded-xl px-3 py-2 cursor-pointer hover:border-primary/50 hover:text-foreground transition-colors w-fit">
                <Upload className="size-4" />
                {t.newRole.uploadFile}
                <input
                  type="file"
                  accept=".pdf,.txt"
                  className="hidden"
                  onChange={(e) => handleFile("jd", e.target.files?.[0] ?? null)}
                />
              </label>
              <Textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder={t.newRole.jdPlaceholder}
                className="h-40"
                required
              />
            </CardContent>
          </Card>

          <Card onFocusCapture={() => setFocus("cv")}>
            <CardHeader>
              <SectionHeader icon={FileUser} tone="pink" title={t.newRole.cv} description={t.newRole.fileHint} />
            </CardHeader>
            <CardContent className="space-y-3">
              <label className="flex items-center gap-2 text-sm text-muted-foreground border border-dashed rounded-xl px-3 py-2 cursor-pointer hover:border-primary/50 hover:text-foreground transition-colors w-fit">
                <Upload className="size-4" />
                {t.newRole.uploadFile}
                <input
                  type="file"
                  accept=".pdf,.txt"
                  className="hidden"
                  onChange={(e) => handleFile("cv", e.target.files?.[0] ?? null)}
                />
              </label>
              <Textarea
                value={cv}
                onChange={(e) => setCv(e.target.value)}
                placeholder={t.newRole.cvPlaceholder}
                className="h-40"
                required
              />
            </CardContent>
          </Card>

          <Card onFocusCapture={() => setFocus("purpose")}>
            <CardHeader>
              <SectionHeader icon={ClipboardList} tone="amber" title={t.newRole.interviewPurpose} description={t.newRole.interviewPurposeHint} />
            </CardHeader>
            <CardContent>
              <Textarea
                value={interviewPurpose}
                onChange={(e) => setInterviewPurpose(e.target.value)}
                placeholder={t.newRole.interviewPurposePlaceholder}
                className="h-28"
              />
            </CardContent>
          </Card>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" disabled={submitting} size="lg" className="h-12 rounded-full px-8 text-base">
            {submitting ? <Loader2 className="size-5 animate-spin" /> : null}
            {submitting ? t.newRole.creating : t.newRole.create}
            {!submitting && <ArrowRight className="size-5" />}
          </Button>
          </form>

          <aside className="rise-in lg:sticky lg:top-24 lg:self-start">
            <RoleCoach
              name={t.newRole.coachName}
              tip={tip}
              title={t.newRole.progressTitle}
              steps={steps}
              doneText={t.newRole.progressDone}
            />
          </aside>
        </div>
      </main>
    </div>
  );
}
