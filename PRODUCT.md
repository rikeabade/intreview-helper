# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The Candidate: a job seeker, usually in tech, preparing for a specific upcoming technical interview. They run the app on their own machine (local Next.js server, local Ollama model) and are working through one Target Role at a time, often right after a recruiter sent details of the process. Intended audience is anyone who clones the project, not only the author; first-run experience must work without hand-holding. Interface languages: PT-BR and English.

## Product Purpose

Intreview is a free, private, 100% local technical-interview simulator. The Candidate enters a company, a job description, their CV and optionally the recruiter's Interview Purpose; the app researches how that company (or, for a consultancy, its client) really interviews, then runs an adaptive simulated interview calibrated to that research and ends with a Report. A separate Job Search module finds open positions by company and role. Success is the Candidate walking into the real interview better prepared, without paying for anything or sending personal data to a third party.

## Positioning

Preparation is built around the one real interview coming up (that company's research, the recruiter's stated structure, the Candidate's own CV), not generic question banks, and everything runs locally with free tooling.

## Operating Context

- LLM: local Ollama (default `gemma4:12b`); web research via the Tavily free tier; open job boards via public Greenhouse, Lever and Ashby APIs.
- Persistence is plain files under `data/` (markdown and JSON), git-ignored; no database.
- Candidate-supplied text (job description, CV, Interview Purpose) and fetched web content are untrusted input to the model.
- Typical flow: create a Target Role, optionally edit its texts, run research for a Research Dossier, start an Interview Session by Phases, read the Report.

## Capabilities and Constraints

- Target Role with editable Job Description, CV, Interview Purpose and Research Dossier at any time.
- Interview Phases: behavioral, technical Q&A, system design, live coding (Monaco editor).
- Job Search: saved searches by company, role, location and Work Mode; Job Listings link out to the original posting only.
- Constraint: free to run, no account, no paid APIs required; privacy of CV and interview data is a hard requirement, backed by SECURITY.md and the secret-scanning pre-commit hook.
- Domain vocabulary lives in GLOSSARY.md (Candidate, Target Role, Research Dossier, Interview Purpose, Interview Session, Phase, Job Search, Job Listing, Work Mode).
- Open decision: repository visibility and release timing are handled by the author; this record does not state that the project is already published.

## Brand Commitments

Name "Intreview". Licensed MIT, copyright "rikeabade". Voice so far is friendly, direct, and written in the Candidate's own language.

## Evidence on Hand

No user testimonials, metrics or case studies exist; none may be invented. Real artifacts: README, SECURITY.md, LICENSE, GLOSSARY.md, ADR 0001 (file-based persistence).

## Product Principles

1. The upcoming interview is the center; every screen should move the Candidate toward being ready for it.
2. Local and private by default: nothing about the Candidate leaves the machine except the explicit web research and job searches they trigger.
3. Honest about uncertainty: research is best-effort, work mode can be unidentified, and the app says so instead of inventing.
4. Free to run end to end; never require a paid service.
5. A stranger can install and use it without help.

## Accessibility & Inclusion

Bilingual (PT-BR/EN) across UI, interview and reports. Honor `prefers-reduced-motion` and keep dark and light themes both first-class. No stricter standard has been specified.
