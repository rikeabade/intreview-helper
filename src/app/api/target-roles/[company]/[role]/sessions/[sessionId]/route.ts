import { NextRequest, NextResponse } from "next/server";
import { getTargetRole } from "@/lib/targetRole";
import {
  loadState,
  submitAnswer,
  endPhaseManually,
  startPhase,
  finishSession,
} from "@/lib/interview";
import { isValidSessionId, isValidSlug } from "@/lib/paths";

export async function GET(
  _req: Request,
  {
    params,
  }: { params: Promise<{ company: string; role: string; sessionId: string }> }
) {
  const { company, role, sessionId } = await params;
  if (!isValidSlug(company) || !isValidSlug(role) || !isValidSessionId(sessionId)) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  const state = await loadState(company, role, sessionId);
  if (!state) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  return NextResponse.json({ state });
}

export async function POST(
  req: NextRequest,
  {
    params,
  }: { params: Promise<{ company: string; role: string; sessionId: string }> }
) {
  const { company, role, sessionId } = await params;
  const detail = await getTargetRole(company, role);
  if (!detail) {
    return NextResponse.json({ error: "Target Role not found" }, { status: 404 });
  }
  if (!isValidSessionId(sessionId)) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  let state = await loadState(company, role, sessionId);
  if (!state) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const body = await req.json();
  const action = body.action as string;

  try {
    const currentPhaseId = state.selectedPhases[state.currentPhaseIndex];

    if (action === "answer") {
      const result = await submitAnswer(state, detail, currentPhaseId, body.answer ?? "");
      return NextResponse.json({
        state: result.state,
        feedback: result.feedback,
        question: result.question,
        phaseComplete: result.phaseComplete,
      });
    }

    if (action === "end-phase") {
      state = await endPhaseManually(state, currentPhaseId);
      return NextResponse.json({ state, phaseComplete: true });
    }

    if (action === "next-phase") {
      const nextIndex = state.currentPhaseIndex + 1;
      if (nextIndex >= state.selectedPhases.length) {
        return NextResponse.json({ state, allPhasesDone: true });
      }
      state.currentPhaseIndex = nextIndex;
      const nextPhaseId = state.selectedPhases[nextIndex];
      const result = await startPhase(state, detail, nextPhaseId);
      return NextResponse.json({ state: result.state, question: result.question });
    }

    if (action === "finish") {
      const result = await finishSession(state, detail);
      return NextResponse.json({ state: result.state, filePath: result.filePath });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
