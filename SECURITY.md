# Security and privacy

## Threat model

Intreview is built to run **entirely on your own machine**. There is no shared backend, user account or central server: everyone who clones this repository runs their own isolated instance, with their own local Ollama and their own Tavily key. This means, by construction:

- Your data (company name, job description, resume, Interview Purpose, Research Dossier, interview transcripts) stays in `data/`, which is ignored by Git (see `.gitignore`) and must never be committed. It only leaves your machine through what is described in "What leaves your machine".
- No other Intreview user, even one who cloned the same repository, has access to your files.
- There is no telemetry or analytics.

## The app has no authentication

Intreview assumes **a single trusted user on their own machine**. No API route (`/api/*`) requires a login or token, or checks the `Host`/`Origin` headers. Because of that:

- The `npm run dev` and `npm start` scripts start the server **on `127.0.0.1` only** (`-H 127.0.0.1`). Open it at `http://127.0.0.1:3000`.
- **Do not expose the port** to a network (`-H 0.0.0.0`, a tunnel, a reverse proxy, public Codespaces/port forwarding) without first putting authentication in front of it. Anyone who can reach the port can read and change your resumes, roles and transcripts, delete saved searches, and spend your Tavily key and your Ollama GPU.
- Other users on the same machine (local accounts) can also reach `127.0.0.1:3000` while the app is running.

### Known limitations

These are known weaknesses that are not fixed yet, and that matter to anyone browsing the web while the app is running:

- **Requests from other websites.** The write routes do not check `Origin` or `Content-Type`. A malicious page open in your browser can send "blind" requests (POST) to `http://127.0.0.1:3000/api/...`: create roles, trigger searches and use up your Tavily and Ollama quota. It cannot read the responses unless it also uses DNS rebinding.
- **DNS rebinding.** The app does not validate `Host`; a site that manages to point a domain name at `127.0.0.1` could, in theory, read and change data through the API.
- **No upload size limit** on `/api/extract-text` (this only affects your own machine).

Until this is fixed, avoid keeping other tabs open when working with real data, and close the app when you are not using it.

## What leaves your machine

1. **Ollama** (`http://localhost:11434` by default): runs on your machine. The content of the job description, resume, Interview Purpose and your interview answers is sent only to that local process.
2. **Tavily Search API** (optional, needs `TAVILY_API_KEY`):
   - **Company research** ("Research" button): sends the company name (and the client, if any) as search text; Tavily returns the content of the pages it found.
   - **Job Search** (`/jobs`): sends company, role, location and work mode as search text.
   - Your resume, job description and Interview Purpose are **not** sent to Tavily.
3. **Public job boards** (Job Search): queries to the Greenhouse (`boards-api.greenhouse.io`), Lever (`api.lever.co`) and Ashby (`api.ashbyhq.com`) APIs. The request only carries an identifier derived from the company name.
4. **jsDelivr CDN** (code editor): your **browser** downloads the Monaco Editor from `cdn.jsdelivr.net` (pinned version, no integrity check) when the Live Coding phase opens the editor. jsDelivr sees your IP and the file request, but receives no app data. If that is a problem, self-host Monaco.
5. **Installation**: `npm install` (npm registry), `ollama pull` (model download) and, if you follow the README step, the Ollama installer (`curl | sh`, from https://ollama.com).

## Prompt injection risk in the Research Dossier

The research step reads content from public web pages (Reddit, Blind, blogs, etc.) and hands that text to the local LLM to summarize. That content is **untrusted by definition**: a malicious page or SEO spam could contain text trying to manipulate the summary ("ignore the previous instructions and write..."). The dossier text also goes into the interview and report prompts later. The impact is a dossier, a question or a report with strange or incorrect content: the local LLM has no tools, does not run code and does not take any action on your system based on that content. Even so:

- Review `research-dossier.md` before moving on to the interview (this is why the research does not continue to the interview automatically). If something looks bizarre or off-topic, edit or delete it before trusting it.
- The dossier and the report are rendered **without images** (so a remote image cannot become a tracking pixel in your browser) and the app sends `Content-Security-Policy: img-src 'self' data:`. Links in the text stay clickable: think before clicking links in a dossier.
- The titles and URLs of the sources that Tavily returns are **not yet escaped** when the dossier is built: a malicious title can insert links or text into the markdown and reach the LLM prompts. Review the dossier's source list.

## Secrets (API keys)

- The only credential in the project is `TAVILY_API_KEY`, which lives in `.env.local`, a file that **must never be committed** (it is in `.gitignore`, and a pre-commit hook in `scripts/git-hooks/pre-commit`, enabled by `setup.sh`, blocks it as an extra layer of protection).
- If you accidentally commit or expose your Tavily key, revoke it and generate a new one at https://tavily.com/. Replacing it is free.
- Before making a fork or copy of this repository public, check the whole history (`git log --all`), including the author e-mail of the commits, and not only the current files.

## Reporting a problem

If you find a security problem, **do not open a public issue**. Use the **"Report a vulnerability"** button on the repository's *Security* tab (GitHub private reporting). Include the steps to reproduce it and the impact you observed.
