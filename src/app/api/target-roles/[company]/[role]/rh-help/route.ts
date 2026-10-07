import { NextRequest, NextResponse } from "next/server";
import path from "node:path";
import { getTargetRole } from "@/lib/targetRole";
import { ollamaChat } from "@/lib/ollama";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/lib/locale";
import fs from "node:fs/promises";
import { targetRoleDir } from "@/lib/paths";

const RH_ANSWERS_FILE = "rh-answers.json";

interface RHAnswer {
  question: string;
  answer: string;
}

interface RHHelpResponse {
  answers: RHAnswer[];
  generatedAt: string;
}

const DEFAULT_QUESTIONS: Record<Locale, string[]> = {
  "pt-BR": [
    "Fale sobre você.",
    "Por que você quer trabalhar nesta empresa?",
    "Quais são seus maiores pontos fortes?",
    "Qual é o seu maior ponto fraco?",
    "Conte sobre um desafio que você enfrentou e como resolveu.",
    "Onde você se vê daqui a 5 anos?",
    "Por que você saiu (ou quer sair) do seu emprego atual?",
    "Por que devemos contratá-lo?",
  ],
  en: [
    "Tell me about yourself.",
    "Why do you want to work at this company?",
    "What are your greatest strengths?",
    "What is your greatest weakness?",
    "Tell me about a challenge you faced and how you resolved it.",
    "Where do you see yourself in 5 years?",
    "Why did you leave (or want to leave) your current job?",
    "Why should we hire you?",
  ],
};

function buildRHSystemPrompt(
  jobDescription: string,
  cv: string,
  researchDossier: string | null,
  locale: Locale,
  questions: string[]
): string {
  const dossierBlock = researchDossier
    ? locale === "en"
      ? `\n\nResearch Dossier about the company:\n${researchDossier}`
      : `\n\nResearch Dossier sobre a empresa:\n${researchDossier}`
    : locale === "en"
      ? "\n\n(No Research Dossier available.)"
      : "\n\n(Nenhum Research Dossier disponível.)";

  const questionsList = questions.map((q, i) => `${i + 1}. ${q}`).join("\n");

  if (locale === "en") {
    return `You are an HR interview preparation expert. Given the job description and candidate CV below, generate structured answers for these questions:

${questionsList}

Job Description:
${jobDescription}

Candidate's CV:
${cv}
${dossierBlock}

Instructions:
- Answer EACH question individually.
- Use STAR format (Situation, Task, Action, Result) for behavioral questions where applicable.
- Keep answers concise (2-4 sentences each).
- Align answers with the skills and requirements mentioned in the job description.
- Use the CV to provide specific examples from the candidate's experience.
- Output format (exactly this, no extra text):

QUESTION: <question text>
ANSWER: <answer text>

QUESTION: <question text>
ANSWER: <answer text>

...`;
  }

  return `Você é um especialista em preparação para entrevistas de RH. Dado a descrição da vaga e o CV do candidato abaixo, gere respostas estruturadas para estas perguntas:

${questionsList}

Job Description:
${jobDescription}

CV do candidato:
${cv}
${dossierBlock}

Instruções:
- Responda CADA pergunta individualmente.
- Use formato STAR (Situação, Tarefa, Ação, Resultado) para perguntas comportamentais quando aplicável.
- Mantenha as respostas concisas (2-4 frases cada).
- Alinhe as respostas com as skills e requisitos mencionados na job description.
- Use o CV para dar exemplos específicos da experiência do candidato.
- Formato de saída (exatamente este, sem texto extra):

PERGUNTA: <texto da pergunta>
RESPOSTA: <texto da resposta>

PERGUNTA: <texto da pergunta>
RESPOSTA: <texto da resposta>

...`;
}

function parseRHResponse(raw: string, locale: Locale): RHAnswer[] {
  const questionKey = locale === "en" ? "QUESTION:" : "PERGUNTA:";
  const answerKey = locale === "en" ? "ANSWER:" : "RESPOSTA:";

  const answers: RHAnswer[] = [];
  const parts = raw.split(new RegExp(`${questionKey}\\s*`, "g"));

  for (const part of parts) {
    if (!part.trim()) continue;
    const answerMatch = part.match(new RegExp(`${answerKey}\\s*([\\s\\S]*)`));
    const questionMatch = part.match(/^([\s\S]*?)(?:\n|$)/);

    if (questionMatch && answerMatch) {
      answers.push({
        question: questionMatch[1].trim(),
        answer: answerMatch[1].trim(),
      });
    }
  }

  // Fallback: if parsing failed, return original questions with empty answers
  if (answers.length === 0) {
    return DEFAULT_QUESTIONS[locale].map((q) => ({ question: q, answer: "" }));
  }

  return answers;
}

async function readRHAnswers(
  companySlug: string,
  roleSlug: string
): Promise<RHHelpResponse | null> {
  try {
    const dir = targetRoleDir(companySlug, roleSlug);
    const filePath = path.join(dir, RH_ANSWERS_FILE);
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content) as RHHelpResponse;
  } catch {
    return null;
  }
}

async function writeRHAnswers(
  companySlug: string,
  roleSlug: string,
  answers: RHAnswer[]
): Promise<void> {
  const dir = targetRoleDir(companySlug, roleSlug);
  await fs.mkdir(dir, { recursive: true });
  const filePath = path.join(dir, RH_ANSWERS_FILE);
  const data: RHHelpResponse = {
    answers,
    generatedAt: new Date().toISOString(),
  };
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ company: string; role: string }> }
) {
  const { company, role } = await params;
  const cached = await readRHAnswers(company, role);
  if (cached) {
    return NextResponse.json(cached);
  }
  return NextResponse.json({ answers: [], generatedAt: null });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ company: string; role: string }> }
) {
  const { company, role } = await params;

  const detail = await getTargetRole(company, role);
  if (!detail) {
    return NextResponse.json({ error: "Target Role not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const locale = isLocale(body.locale) ? body.locale : DEFAULT_LOCALE;
  const customQuestions: string[] = Array.isArray(body.customQuestions) ? body.customQuestions : [];

  // Validate job description exists
  if (!detail.jobDescription || detail.jobDescription.trim().length < 50) {
    return NextResponse.json(
      {
        error:
          locale === "en"
            ? "Job description is too short or missing. Add a job description first."
            : "A job description está muito curta ou ausente. Adicione uma job description primeiro.",
      },
      { status: 400 }
    );
  }

  const questionsToGenerate = customQuestions.length > 0 ? customQuestions : DEFAULT_QUESTIONS[locale as Locale];

  try {
    const prompt = buildRHSystemPrompt(
      detail.jobDescription,
      detail.cv,
      detail.researchDossier,
      locale,
      questionsToGenerate
    );

    const raw = await ollamaChat(
      [
        { role: "system", content: prompt },
        {
          role: "user",
          content:
            locale === "en"
              ? "Generate the answers now."
              : "Gere as respostas agora.",
        },
      ],
      locale
    );

    const newAnswers = parseRHResponse(raw, locale);

    // Merge with existing cached answers if custom questions
    let finalAnswers = newAnswers;
    if (customQuestions.length > 0) {
      const cached = await readRHAnswers(company, role);
      if (cached && cached.answers.length > 0) {
        finalAnswers = [...cached.answers, ...newAnswers];
      }
    }

    // Persist
    await writeRHAnswers(company, role, finalAnswers);

    return NextResponse.json({
      answers: finalAnswers,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}