import { NextRequest, NextResponse } from "next/server";
import { getTargetRole } from "@/lib/targetRole";
import { createSession, startPhase } from "@/lib/interview";
import { DEFAULT_LOCALE, isLocale } from "@/lib/locale";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ company: string; role: string }> }
) {
  const { company, role } = await params;
  const detail = await getTargetRole(company, role);
  if (!detail) {
    return NextResponse.json({ error: "Target Role not found" }, { status: 404 });
  }

  const body = await req.json();
  const selectedPhaseIds: string[] = body.selectedPhaseIds ?? [];
  const questionsPerPhase: number = body.questionsPerPhase ?? 5;
  const locale = isLocale(body.locale) ? body.locale : DEFAULT_LOCALE;

  if (selectedPhaseIds.length === 0) {
    return NextResponse.json(
      { error: locale === "en" ? "Select at least one phase" : "Selecione pelo menos uma fase" },
      { status: 400 }
    );
  }

  try {
    let state = await createSession({ role: detail, selectedPhaseIds, questionsPerPhase, locale });
    const firstPhaseId = state.selectedPhases[0];
    const result = await startPhase(state, detail, firstPhaseId);
    state = result.state;

    return NextResponse.json({ state, question: result.question });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
