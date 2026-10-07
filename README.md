# Intreview

A technical-interview simulator that is **100% local** and tailored to one real role: you enter the company, the job description and your resume, and Intreview researches how that company usually interviews before simulating one with you, with adaptive questions, feedback and a final report.

The app and the LLM run on your machine. The only internet calls are the optional searches (company research and Job Search) and the code editor loaded from a CDN (see [SECURITY.md](./SECURITY.md)).

The interface comes in **English (default) and Portuguese (PT-BR)**: use the language button in the header. The interview, the research dossier and the final report follow the selected language.

## Quick setup

On Linux or macOS, after cloning the repository you can run:

```bash
./scripts/setup.sh
```

The script checks Node, tells you how to install Ollama if it is missing, detects your VRAM/RAM to recommend the best model, pulls the model and creates `.env.local`. After that, just fill in the Tavily key (step 2 below) and run `npm run dev`.

If you prefer to do it by hand, or you are on Windows, follow the steps below.

### 1. Ollama (local LLM)

**Linux:**
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

**macOS:**
```bash
brew install ollama
# or download the app from https://ollama.com/download
```

**Windows:** install through WSL2 (recommended, better GPU support and performance) or use the native installer at https://ollama.com/download/windows.
With WSL2: open an Ubuntu (WSL) terminal and follow the Linux steps above inside it. The rest of the setup (Node, `npm run dev`) also runs inside WSL2.

Once it is installed, pull the recommended model:

```bash
ollama pull gemma4:12b
```

Models we tested with Intreview (same real-role prompt, on a 12 GB Radeon RX 7700 XT, 8192-token context window):

| Model | Size | Test result |
|---|---|---|
| `gemma4:12b` (**default**) | ~8 GB | Fits 100% on the GPU (even with a 16384 context), ~56-60 tokens/s. Questions personalized from the resume, specific feedback, respects the requested language. |
| `qwen2.5:14b-instruct` | ~9 GB | Works (~36 tokens/s), but the questions are more generic. |
| `qwen3.5:9b` | ~6.6 GB | Fast and specific, but it answered in Portuguese while the interface was in English. Not recommended. |
| `gemma4:26b` | ~17 GB | Does not fit in 12 GB: ~4 tokens/s with part of it on the CPU, ~45 s per question and multi-minute reports. Not recommended for 12 GB. |

**Untested** models (use at your own risk): `gemma4:e4b` and `gemma4:e2b`, for GPUs with less than 12 GB. `./scripts/setup.sh` picks a model from the detected memory and warns when it is untested. Also check the model's license on its page at https://ollama.com/library.

Ollama's default context window (4096 tokens) is too small: the Intreview prompt (job description + resume + dossier + conversation) goes past it, and the beginning used to be cut off silently. The app uses 8192 by default; raise `OLLAMA_NUM_CTX` in `.env.local` if your memory allows it.

**Timeout.** The app waits for the model's full answer (no streaming). Long answers, such as the final report, can take a while on slow or CPU-bound models. Intreview waits up to 15 minutes per call (`OLLAMA_TIMEOUT_MS`, in milliseconds) and, if that deadline passes, shows a message asking for a smaller model or a longer deadline. Node's 5-minute `fetch` limit was removed on purpose: it cut off legitimate generations from large models and showed up, misleadingly, as "could not connect to Ollama".

If you have an AMD GPU on Linux and Ollama does not detect it automatically, try:
```bash
export HSA_OVERRIDE_GFX_VERSION=11.0.0
```
(add it to `.bashrc`/`.zshrc` if you always need it).

### 2. Tavily Search API (optional, only for the research and Job Search steps)

Create a free key, no credit card (1000 credits/month), at https://tavily.com/. Without it the app works normally, just without the company research and the web part of Job Search.

### 3. Environment variables

```bash
cp .env.local.example .env.local
```

Fill in `TAVILY_API_KEY` in `.env.local`. Change `OLLAMA_MODEL` if you pulled a different model than the default.

### 4. Install and run

```bash
npm install
npm run dev
```

Open http://127.0.0.1:3000.

> The server listens **only on `127.0.0.1`** (the `dev` and `start` scripts already pass `-H 127.0.0.1`) and the app has **no authentication**: use the `127.0.0.1` address and do not expose the port on a network, through a tunnel or a reverse proxy without putting authentication in front of it first. Details in [SECURITY.md](./SECURITY.md).

## How it works

1. **New role** (`/roles/new`): paste or upload (PDF/TXT) the job description and your resume, enter the company and, for a consultancy, the client. You can also add an optional **Interview Purpose** (for example, what the recruiter told you about the stages of the process).
2. **Research**: on the role page, start a search (Tavily Search) about how the company runs technical interviews, summarized by the local LLM into a Research Dossier. The result lives in `data/<company>/<role>/research-dossier.md`; the job description, resume, interview purpose and dossier can all be edited at any time from the role page.
3. **Start the interview**: choose the phases (Behavioral, Technical Q&A, System Design, Live Coding) and how many questions per phase. The interviewer (the local LLM) adapts the questions to the job description, the resume and the Research Dossier, giving inline feedback on every answer.
4. **Final report**: when all the phases are done, a report is generated and saved together with the full transcript in `data/<company>/<role>/sessions/<id>.md`.
5. **Job Search** (`/jobs`): search open positions by company, role, location and work mode, with saved searches you can re-run. Listings link to the original posting.
6. **Delete a role**: use the trash button on a role card on the home screen. This permanently removes its job description, resume, dossier and every interview.

All your data lives in `data/` (git-ignored, never committed; see [SECURITY.md](./SECURITY.md)).

## Security and privacy

Read [SECURITY.md](./SECURITY.md) before using real data. It summarizes what leaves your machine (optional searches on Tavily and on the Greenhouse, Lever and Ashby job boards, and the Monaco editor loaded from the jsDelivr CDN), what the app does not protect (there is no authentication) and how your data is protected against accidental commits.

## License

[MIT](./LICENSE).
