# Intreview

A local-first tool that simulates a technical job interview, tailored to a specific Company and Job Description, informed by real interview-experience research about that company.

## Language

**Candidate**:
The person using the tool to practice — always the local user. There is only ever one Candidate per install.
_Avoid_: User, applicant

**Target Role**:
The Job Description plus the Company the Candidate is preparing to interview for. Identifies a single application the Candidate is practicing against. Marked as either a product company or a consultancy; when it's a consultancy, it may optionally name a Client.
_Avoid_: Job, position, application

**Client**:
The end customer a consultancy Target Role's work is actually done for. Only applies when the Target Role's Company is a consultancy — the Research Dossier then also covers how that Client's own interview process tends to work.
_Avoid_: Customer, account

**Interview Purpose**:
Optional free-text context the Candidate pastes in, typically forwarded by the recruiter, describing how the real interview is actually structured (e.g. its stated stages or topics). Distinct from the Job Description (describes the role) and the Research Dossier (public research about the Company) — it's a first-party signal from whoever is running the real interview. Editable at any time from the Target Role screen; used to calibrate both the Research Dossier and the Interview Session's Phase questions.
_Avoid_: Interview structure, recruiter notes, instructions

**Research Dossier**:
The set of findings gathered from public reviews/feedback (e.g. Glassdoor, Blind, Reddit) about how the Company — or, if the Company is a consultancy, its clients — actually conducts technical interviews. Built once per Target Role and used to shape the Interview Session.
_Avoid_: Reviews, research, notes

**Job Search**:
A saved query for open positions at a specific Company for a specific role, optionally narrowed by location and Work Mode, together with the Job Listings its latest run found. Can be re-run to refresh its results. Separate from the interview-practice flow: it helps the Candidate find openings, not prepare for them.
_Avoid_: Vacancy search, scan

**Job Listing**:
One open position found by a Job Search, represented by a link to the external posting that the Candidate opens manually. A pointer only — not a Target Role, which the Candidate creates separately if they decide to practice for it.
_Avoid_: Target Role, job, vacancy

**Work Mode**:
Whether a Job Listing is remote, hybrid or on-site, as inferred from its text; "unknown" when it can't be told.
_Avoid_: Modality, location type

**Interview Session**:
One run of the simulated interview against a Target Role, made up of one or more Phases, producing a Transcript and a Report.
_Avoid_: Interview, run, mock interview

**Phase**:
A distinct segment of an Interview Session with its own focus (e.g. behavioral, technical Q&A, system design, live coding). The set of Phases for a session is chosen based on the Research Dossier and the Job Description.
_Avoid_: Stage, round, section

**Interviewer**:
The local LLM acting as the persona conducting a Phase, adapted in style and question selection to match the Research Dossier's findings about the Company's real interview style.
_Avoid_: Bot, AI, assistant

**Inline Feedback**:
Short, in-the-moment commentary the Interviewer gives right after a Candidate's answer during a Phase.
_Avoid_: Comment, note

**Report**:
The consolidated end-of-session evaluation produced after an Interview Session ends, summarizing strengths/weaknesses against what the Research Dossier says the Company values.
_Avoid_: Summary, results, scorecard

**Transcript**:
The full saved record of everything said during an Interview Session (questions, answers, Inline Feedback). Persisted locally alongside the Report.
_Avoid_: History, log
