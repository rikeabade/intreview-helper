import { Agent, fetch } from "undici";
import type { Locale } from "./locale";

const OLLAMA_HOST = process.env.OLLAMA_HOST ?? "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "gemma4:12b";
const OLLAMA_NUM_CTX = Number(process.env.OLLAMA_NUM_CTX) || 8192;
const OLLAMA_TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS) || 15 * 60 * 1000;

// Non-streaming calls get no response headers until the model finishes generating;
// Node's default fetch timeout (5 min) cut off slow models. The overall deadline is
// now OLLAMA_TIMEOUT_MS, enforced by the AbortSignal.
const dispatcher = new Agent({ headersTimeout: 0, bodyTimeout: 0 });

let thinkSupported = true;

function stripThinking(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function ollamaChat(
  messages: ChatMessage[],
  locale: Locale = "en"
): Promise<string> {
  const request = (think: boolean) =>
    fetch(`${OLLAMA_HOST}/api/chat`, {
      dispatcher,
      signal: AbortSignal.timeout(OLLAMA_TIMEOUT_MS),
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages,
        stream: false,
        options: { num_ctx: OLLAMA_NUM_CTX },
        ...(think ? { think: false } : {}),
      }),
    });

  let res: Awaited<ReturnType<typeof request>>;
  try {
    res = await request(thinkSupported);
    if (res.status === 400 && thinkSupported) {
      const body = await res.clone().text();
      if (/think/i.test(body)) {
        thinkSupported = false;
        res = await request(false);
      }
    }
  } catch (err) {
    if (err instanceof Error && err.name === "TimeoutError") {
      const minutes = Math.round(OLLAMA_TIMEOUT_MS / 60000);
      throw new Error(
        locale === "en"
          ? `Ollama didn't answer within ${minutes} minutes. The model "${OLLAMA_MODEL}" may be too slow for your hardware; try a smaller model or raise OLLAMA_TIMEOUT_MS.`
          : `O Ollama não respondeu em ${minutes} minutos. O modelo "${OLLAMA_MODEL}" pode ser lento demais para o seu hardware; tente um modelo menor ou aumente OLLAMA_TIMEOUT_MS.`
      );
    }
    throw new Error(
      locale === "en"
        ? `Couldn't connect to Ollama at ${OLLAMA_HOST}. Make sure it's running (ollama serve) and try again.`
        : `Não foi possível conectar ao Ollama em ${OLLAMA_HOST}. Verifique se ele está rodando (ollama serve) e tente novamente.`
    );
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      locale === "en"
        ? `Ollama request failed (${res.status}). Make sure Ollama is running at ${OLLAMA_HOST} and that the "${OLLAMA_MODEL}" model has been pulled (ollama pull ${OLLAMA_MODEL}). Detail: ${text}`
        : `Ollama request failed (${res.status}). Verifique se o Ollama está rodando em ${OLLAMA_HOST} e se o modelo "${OLLAMA_MODEL}" foi baixado (ollama pull ${OLLAMA_MODEL}). Detalhe: ${text}`
    );
  }

  const data = (await res.json()) as {
    message?: { content?: string };
    prompt_eval_count?: number;
  };
  if (data.prompt_eval_count && data.prompt_eval_count >= OLLAMA_NUM_CTX - 64) {
    console.warn(
      `Ollama prompt used ${data.prompt_eval_count} of ${OLLAMA_NUM_CTX} context tokens; the start of the prompt may have been truncated. Raise OLLAMA_NUM_CTX.`
    );
  }
  return stripThinking(data.message?.content ?? "");
}
