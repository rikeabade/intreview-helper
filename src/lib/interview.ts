import fs from "node:fs/promises";
import path from "node:path";
import { sessionsDir, sessionStateDir } from "./paths";
import { ollamaChat, type ChatMessage } from "./ollama";
import { getPhases, detectLanguage, type PhaseDef } from "./phases";
import type { Locale } from "./locale";
import type { TargetRoleDetail } from "./targetRole";

export interface QAEntry {
  question: string;
  answer: string;
  feedback: string;
}

export interface PhaseProgress {
  phaseId: string;
  language?: string;
  entries: QAEntry[];
  pendingQuestion: string | null;
  done: boolean;
}

export interface SessionState {
  id: string;
  companySlug: string;
  roleSlug: string;
  companyName: string;
  roleTitle: string;
  locale: Locale;
  selectedPhases: string[];
  questionsPerPhase: number;
  currentPhaseIndex: number;
  phases: Record<string, PhaseProgress>;
  finished: boolean;
  report: string | null;
  createdAt: string;
}

const STATE_FILE = "state.json";

function L(locale: Locale, pt: string, en: string): string {
  return locale === "en" ? en : pt;
}

async function exists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

function statePath(companySlug: string, roleSlug: string, sessionId: string): string {
  return path.join(sessionStateDir(companySlug, roleSlug, sessionId), STATE_FILE);
}

async function saveState(state: SessionState): Promise<void> {
  const dir = sessionStateDir(state.companySlug, state.roleSlug, state.id);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(
    path.join(dir, STATE_FILE),
    JSON.stringify(state, null, 2),
    "utf-8"
  );
}

// Path segments built by the app are only ever [a-z0-9-] and start with an
// alphanumeric: slugify() output (which may still end in "-" after its 60-char
// truncation, or contain "--" after a collision suffix) and createSession ids.
// Anything else (".", "/", "\", "%", ...) must never reach the filesystem.
const SAFE_SEGMENT = /^[a-z0-9][a-z0-9-]*$/;

export async function loadState(
  companySlug: string,
  roleSlug: string,
  sessionId: string
): Promise<SessionState | null> {
  if (
    !SAFE_SEGMENT.test(companySlug) ||
    !SAFE_SEGMENT.test(roleSlug) ||
    !SAFE_SEGMENT.test(sessionId)
  ) {
    return null;
  }
  const p = statePath(companySlug, roleSlug, sessionId);
  if (!(await exists(p))) return null;
  const raw = await fs.readFile(p, "utf-8");
  return JSON.parse(raw) as SessionState;
}

export interface CreateSessionInput {
  role: TargetRoleDetail;
  selectedPhaseIds: string[];
  questionsPerPhase: number;
  locale: Locale;
}

export async function createSession(input: CreateSessionInput): Promise<SessionState> {
  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  const language = detectLanguage(input.role.jobDescription);

  const phases: Record<string, PhaseProgress> = {};
  for (const phaseId of input.selectedPhaseIds) {
    phases[phaseId] = {
      phaseId,
      language: phaseId === "live-coding" ? language : undefined,
      entries: [],
      pendingQuestion: null,
      done: false,
    };
  }

  const state: SessionState = {
    id,
    companySlug: input.role.meta.companySlug,
    roleSlug: input.role.meta.roleSlug,
    companyName: input.role.meta.companyName,
    roleTitle: input.role.meta.roleTitle,
    locale: input.locale,
    selectedPhases: input.selectedPhaseIds,
    questionsPerPhase: input.questionsPerPhase,
    currentPhaseIndex: 0,
    phases,
    finished: false,
    report: null,
    createdAt: new Date().toISOString(),
  };

  await saveState(state);
  return state;
}

function phaseDef(phaseId: string, locale: Locale): PhaseDef {
  const def = getPhases(locale).find((p) => p.id === phaseId);
  if (!def) throw new Error(`Unknown phase: ${phaseId}`);
  return def;
}

function buildPhaseSystemPrompt(
  role: TargetRoleDetail,
  phase: PhaseDef,
  progress: PhaseProgress,
  locale: Locale
): string {
  const dossierBlock = role.researchDossier
    ? L(
        locale,
        `\n\nResearch Dossier sobre a empresa (use isso para calibrar estilo e temas das perguntas):\n${role.researchDossier}`,
        `\n\nResearch Dossier about the company (use this to calibrate the style and themes of your questions):\n${role.researchDossier}`
      )
    : L(
        locale,
        "\n\n(Nenhum Research Dossier disponível para esta empresa.)",
        "\n\n(No Research Dossier available for this company.)"
      );

  const purposeBlock = role.interviewPurpose?.trim()
    ? L(
        locale,
        `\n\nPropósito da Entrevista informado pela empresa/recrutadora (descreve como a entrevista real está estruturada — use para calibrar o foco desta fase):\n${role.interviewPurpose}`,
        `\n\nInterview Purpose provided by the company/recruiter (describes how the real interview is structured — use it to calibrate this phase's focus):\n${role.interviewPurpose}`
      )
    : "";

  const languageLine = progress.language
    ? L(
        locale,
        `\n\nA linguagem de programação desta fase é: ${progress.language}.`,
        `\n\nThe programming language for this phase is: ${progress.language}.`
      )
    : "";

  if (locale === "en") {
    return `You are a technical interviewer simulating a real interview for the "${role.meta.roleTitle}" role at "${role.meta.companyName}". This is the "${phase.label}" phase of the interview.

Focus of this phase: ${phase.focus}${languageLine}

Job Description:
${role.jobDescription}

Candidate's resume:
${role.cv}
${dossierBlock}${purposeBlock}

Response rules:
- Always write in English (question and feedback), even if the job description, resume or research dossier are in another language.
- Ask ONE question at a time.
- After the first question, before each new question, give short feedback (1-3 sentences) on the candidate's previous answer — direct, specific, no empty praise.
- Adapt the next question based on the previous answer (follow up if the answer was vague or incomplete; move to another topic if it was already covered well).
- ALWAYS reply in exactly this format, with nothing before or after:

FEEDBACK: <feedback on the previous answer, or "N/A" if this is the phase's first question>
QUESTION: <the next question>`;
  }

  return `Você é um entrevistador técnico simulando uma entrevista real para a vaga "${role.meta.roleTitle}" na empresa "${role.meta.companyName}". Esta é a fase "${phase.label}" da entrevista.

Foco desta fase: ${phase.focus}${languageLine}

Job Description:
${role.jobDescription}

CV do candidato:
${role.cv}
${dossierBlock}${purposeBlock}

Regras de resposta:
- Escreva SEMPRE em português do Brasil (pergunta e feedback), mesmo que a vaga, o CV ou o dossiê estejam em outro idioma.
- Faça UMA pergunta por vez.
- Depois da primeira pergunta, antes de cada nova pergunta, dê um feedback curto (1-3 frases) sobre a resposta anterior do candidato — direto, específico, sem elogios vazios.
- Adapte a próxima pergunta com base na resposta anterior (follow-up se a resposta foi vaga ou incompleta; avance para outro tema se já cobriu bem o anterior).
- Responda SEMPRE neste formato exato, sem nada antes ou depois:

FEEDBACK: <feedback sobre a resposta anterior, ou "N/A" se for a primeira pergunta da fase>
QUESTION: <a próxima pergunta>`;
}

function parseInterviewerReply(raw: string): { feedback: string; question: string } {
  const feedbackMatch = raw.match(/FEEDBACK:\s*([\s\S]*?)\s*QUESTION:/i);
  const questionMatch = raw.match(/QUESTION:\s*([\s\S]*)$/i);

  return {
    feedback: feedbackMatch ? feedbackMatch[1].trim() : "",
    question: questionMatch ? questionMatch[1].trim() : raw.trim(),
  };
}

function messagesForPhase(
  role: TargetRoleDetail,
  phase: PhaseDef,
  progress: PhaseProgress,
  locale: Locale
): ChatMessage[] {
  const messages: ChatMessage[] = [
    { role: "system", content: buildPhaseSystemPrompt(role, phase, progress, locale) },
  ];

  for (const entry of progress.entries) {
    messages.push({
      role: "assistant",
      content: `FEEDBACK: N/A\nQUESTION: ${entry.question}`,
    });
    messages.push({ role: "user", content: entry.answer });
  }

  return messages;
}

export interface AdvanceResult {
  state: SessionState;
  feedback: string | null;
  question: string | null;
  phaseComplete: boolean;
}

export async function startPhase(
  state: SessionState,
  role: TargetRoleDetail,
  phaseId: string
): Promise<AdvanceResult> {
  const progress = state.phases[phaseId];
  const def = phaseDef(phaseId, state.locale);

  const messages = messagesForPhase(role, def, progress, state.locale);
  messages.push({
    role: "user",
    content: L(
      state.locale,
      "Comece a fase agora fazendo a primeira pergunta.",
      "Start the phase now by asking the first question."
    ),
  });

  const raw = await ollamaChat(messages, state.locale);
  const { question } = parseInterviewerReply(raw);
  progress.pendingQuestion = question;

  await saveState(state);
  return { state, feedback: null, question, phaseComplete: false };
}

export async function submitAnswer(
  state: SessionState,
  role: TargetRoleDetail,
  phaseId: string,
  answer: string
): Promise<AdvanceResult> {
  const progress = state.phases[phaseId];
  const def = phaseDef(phaseId, state.locale);

  if (!progress.pendingQuestion) {
    throw new Error("No pending question in this phase.");
  }

  const messages = messagesForPhase(role, def, progress, state.locale);
  messages.push({
    role: "assistant",
    content: `FEEDBACK: N/A\nQUESTION: ${progress.pendingQuestion}`,
  });
  messages.push({ role: "user", content: answer });

  const reachedTarget = progress.entries.length + 1 >= state.questionsPerPhase;

  if (reachedTarget) {
    messages.push({
      role: "user",
      content: L(
        state.locale,
        'Esta foi a última pergunta da fase. Responda apenas com: FEEDBACK: <seu feedback sobre a resposta acima>\nQUESTION: (fim da fase)',
        "This was the phase's last question. Reply with only: FEEDBACK: <your feedback on the answer above>\nQUESTION: (end of phase)"
      ),
    });
  }

  const raw = await ollamaChat(messages, state.locale);
  const { feedback, question } = parseInterviewerReply(raw);

  progress.entries.push({
    question: progress.pendingQuestion,
    answer,
    feedback,
  });

  if (reachedTarget) {
    progress.pendingQuestion = null;
    progress.done = true;
    await saveState(state);
    return { state, feedback, question: null, phaseComplete: true };
  }

  progress.pendingQuestion = question;
  await saveState(state);
  return { state, feedback, question, phaseComplete: false };
}

export async function endPhaseManually(
  state: SessionState,
  phaseId: string
): Promise<SessionState> {
  const progress = state.phases[phaseId];
  progress.done = true;
  progress.pendingQuestion = null;
  await saveState(state);
  return state;
}

export async function finishSession(
  state: SessionState,
  role: TargetRoleDetail
): Promise<{ state: SessionState; filePath: string }> {
  const locale = state.locale;
  const transcriptParts: string[] = [];
  for (const phaseId of state.selectedPhases) {
    const def = phaseDef(phaseId, locale);
    const progress = state.phases[phaseId];
    transcriptParts.push(`## ${L(locale, "Fase", "Phase")}: ${def.label}`);
    progress.entries.forEach((entry, i) => {
      transcriptParts.push(
        `**${L(locale, "Pergunta", "Question")} ${i + 1}:** ${entry.question}\n\n**${L(locale, "Resposta", "Answer")}:** ${entry.answer}\n\n**${L(locale, "Feedback", "Feedback")}:** ${entry.feedback}`
      );
    });
  }
  const transcript = transcriptParts.join("\n\n");

  const dossierBlock = role.researchDossier
    ? L(
        locale,
        `\n\nResearch Dossier usado como referência:\n${role.researchDossier}`,
        `\n\nResearch Dossier used as reference:\n${role.researchDossier}`
      )
    : "";

  const comparisonSection = role.researchDossier
    ? L(
        locale,
        `## Comparado ao que a pesquisa indica sobre a empresa
(o quanto o desempenho do candidato se alinha ao que o Research Dossier acima sugere que a empresa valoriza)
`,
        `## Compared to what the research indicates about the company
(how much the candidate's performance aligns with what the Research Dossier above suggests the company values)
`
      )
    : "";

  const reportPrompt =
    locale === "en"
      ? `You just conducted a simulated technical interview for the "${role.meta.roleTitle}" role at "${role.meta.companyName}". Below is the full transcript (questions, candidate answers, feedback given at each point).${dossierBlock}

Transcript:
${transcript}

Write a final Report in Markdown, in English, with this structure${
          role.researchDossier
            ? ""
            : " (there is no Research Dossier for this role — do NOT invent any section about what the company values or market research, stick to the sections below)"
        }:

## Overall summary
## Strengths
## Areas to improve
${comparisonSection}## Recommendation
(an overall qualitative rating: e.g. "ready for this interview", "needs more practice on X")`
      : `Você acabou de conduzir uma entrevista técnica simulada para a vaga "${role.meta.roleTitle}" na empresa "${role.meta.companyName}". Abaixo está o transcript completo (perguntas, respostas do candidato, feedback dado em cada momento).${dossierBlock}

Transcript:
${transcript}

Escreva um Relatório final em Markdown, em português, com esta estrutura${
          role.researchDossier
            ? ""
            : " (não existe Research Dossier para esta vaga — NÃO invente nenhuma seção sobre o que a empresa valoriza ou pesquisa de mercado, fique só nas seções abaixo)"
        }:

## Resumo geral
## Pontos fortes
## Pontos a melhorar
${comparisonSection}## Recomendação
(nota geral qualitativa: ex. "pronto para essa entrevista", "precisa praticar mais X")`;

  const report = await ollamaChat([
    {
      role: "system",
      content: L(
        locale,
        "Você é um avaliador de entrevistas técnicas, direto e específico. Escreva sempre em português do Brasil, mesmo que o transcript ou os documentos estejam em outro idioma.",
        "You are a technical interview evaluator, direct and specific. Always write in English, even if the transcript or documents are in another language."
      ),
    },
    { role: "user", content: reportPrompt },
  ], locale);

  state.finished = true;
  state.report = report;
  await saveState(state);

  const dateStr = new Date(state.createdAt).toLocaleString(locale === "en" ? "en-US" : "pt-BR");

  const finalMarkdown =
    locale === "en"
      ? `# Interview Session — ${role.meta.companyName} / ${role.meta.roleTitle}

Date: ${dateStr}

# Transcript

${transcript}

# Report

${report}
`
      : `# Sessão de Entrevista — ${role.meta.companyName} / ${role.meta.roleTitle}

Data: ${dateStr}

# Transcript

${transcript}

# Report

${report}
`;

  const dir = sessionsDir(state.companySlug, state.roleSlug);
  await fs.mkdir(dir, { recursive: true });
  const filePath = path.join(dir, `${state.id}.md`);
  await fs.writeFile(filePath, finalMarkdown, "utf-8");

  return { state, filePath };
}
