import { createHash } from "node:crypto";
import { tavilySearch } from "./tavily";
import type { JobListing, JobSearchParams, WorkMode } from "./jobTypes";

export function normalize(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function tokens(text: string): string[] {
  return normalize(text)
    .split(/[^a-z0-9+#.]+/)
    .filter((t) => t.length >= 2);
}

export function inferWorkMode(text: string): WorkMode {
  const t = normalize(text);
  if (/\b(hybrid|hibrido|hibrida)\b/.test(t)) return "hybrid";
  if (/\b(remote|remoto|remota|teletrabalho|work from home|anywhere)\b/.test(t)) return "remote";
  if (/\b(on-?site|presencial|in[- ]office)\b/.test(t)) return "onsite";
  return "unknown";
}

export function safeHttpUrl(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  try {
    const u = new URL(raw);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    u.hash = "";
    return u.toString();
  } catch {
    return null;
  }
}

export function listingId(url: string): string {
  return createHash("sha1").update(url).digest("hex").slice(0, 12);
}

function matchesRole(text: string, role: string): boolean {
  const haystack = normalize(text);
  return tokens(role).every((t) => haystack.includes(t));
}

const COMPANY_SUFFIXES = new Set([
  "inc", "ltd", "llc", "sa", "lda", "gmbh", "corp", "corporation", "co",
  "company", "limited", "plc", "ag", "bv", "srl",
]);

function companyCoreWords(company: string): string[] {
  const words = normalize(company)
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/[\s-]+/)
    .filter(Boolean);
  const core = words.filter((w) => !COMPANY_SUFFIXES.has(w));
  return core.length ? core : words;
}

export function slugVariants(company: string): string[] {
  const base = companyCoreWords(company);
  const variants = new Set([base.join(""), base.join("-")]);
  return [...variants].filter((v) => /^[a-z0-9-]{2,60}$/.test(v));
}

async function fetchJson(url: string): Promise<unknown | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function toListing(
  raw: { title: unknown; url: unknown; location: unknown; mode?: WorkMode },
  company: string,
  source: string
): JobListing | null {
  const url = safeHttpUrl(raw.url);
  const title = typeof raw.title === "string" ? raw.title.trim() : "";
  if (!url || !title) return null;
  const location = typeof raw.location === "string" ? raw.location.trim() : "";
  const workMode =
    raw.mode && raw.mode !== "unknown" ? raw.mode : inferWorkMode(`${title} ${location}`);
  return { id: listingId(url), title, company, location, workMode, url, source };
}

function modeFromAts(value: unknown): WorkMode | undefined {
  if (typeof value !== "string") return undefined;
  const v = normalize(value);
  if (v === "remote") return "remote";
  if (v === "hybrid") return "hybrid";
  if (v === "onsite" || v === "on-site") return "onsite";
  return undefined;
}

type Obj = Record<string, unknown>;
const asArray = (v: unknown): Obj[] => (Array.isArray(v) ? (v as Obj[]) : []);

async function fetchGreenhouse(slug: string, company: string): Promise<JobListing[]> {
  const data = (await fetchJson(`https://boards-api.greenhouse.io/v1/boards/${slug}/jobs`)) as Obj | null;
  return asArray(data?.jobs)
    .map((j) =>
      toListing(
        { title: j.title, url: j.absolute_url, location: (j.location as Obj | undefined)?.name },
        company,
        "Greenhouse"
      )
    )
    .filter((l): l is JobListing => l !== null);
}

async function fetchLever(slug: string, company: string): Promise<JobListing[]> {
  const data = await fetchJson(`https://api.lever.co/v0/postings/${slug}?mode=json`);
  return asArray(data)
    .map((j) => {
      const cats = (j.categories ?? {}) as Obj;
      return toListing(
        { title: j.text, url: j.hostedUrl, location: cats.location, mode: modeFromAts(j.workplaceType) },
        company,
        "Lever"
      );
    })
    .filter((l): l is JobListing => l !== null);
}

async function fetchAshby(slug: string, company: string): Promise<JobListing[]> {
  const data = (await fetchJson(`https://api.ashbyhq.com/posting-api/job-board/${slug}`)) as Obj | null;
  return asArray(data?.jobs)
    .filter((j) => j.isListed !== false)
    .map((j) =>
      toListing(
        {
          title: j.title,
          url: j.jobUrl,
          location: j.location,
          mode: modeFromAts(j.workplaceType) ?? (j.isRemote === true ? "remote" : undefined),
        },
        company,
        "Ashby"
      )
    )
    .filter((l): l is JobListing => l !== null);
}

const ATS_FETCHERS: { name: string; fetch: (slug: string, company: string) => Promise<JobListing[]> }[] = [
  { name: "greenhouse", fetch: fetchGreenhouse },
  { name: "lever", fetch: fetchLever },
  { name: "ashby", fetch: fetchAshby },
];

export async function searchAts(
  params: JobSearchParams
): Promise<{ listings: JobListing[]; boards: string[] }> {
  const attempts = ATS_FETCHERS.flatMap((ats) =>
    slugVariants(params.company).map(async (slug) => {
      const all = await ats.fetch(slug, params.company);
      return { board: `${ats.name}:${slug}`, all };
    })
  );
  const settled = await Promise.all(attempts);

  const listings: JobListing[] = [];
  const boards: string[] = [];
  for (const { board, all } of settled) {
    if (all.length === 0) continue;
    boards.push(board);
    listings.push(...all.filter((l) => matchesRole(l.title, params.role)));
  }
  return { listings, boards };
}

const SOURCE_LABELS: [string, string][] = [
  ["linkedin.com", "LinkedIn"],
  ["indeed.com", "Indeed"],
  ["glassdoor.com", "Glassdoor"],
  ["greenhouse.io", "Greenhouse"],
  ["lever.co", "Lever"],
  ["ashbyhq.com", "Ashby"],
  ["workable.com", "Workable"],
  ["smartrecruiters.com", "SmartRecruiters"],
  ["recruitee.com", "Recruitee"],
  ["landing.jobs", "Landing.jobs"],
];

function sourceLabel(url: string): string {
  const host = new URL(url).hostname.replace(/^www\./, "");
  for (const [domain, label] of SOURCE_LABELS) {
    if (host === domain || host.endsWith(`.${domain}`)) return label;
  }
  return host;
}

const BOARD_DOMAINS = ["linkedin.com", "indeed.com", "glassdoor.com", "landing.jobs"];
const ATS_DOMAINS = [
  "greenhouse.io", "lever.co", "ashbyhq.com", "workable.com", "smartrecruiters.com", "recruitee.com",
];

function isIndexPage(title: string, url: string): boolean {
  if (/^\s*\d[\d.,]*\+?\s.*\bjobs?\b/i.test(title)) return true;
  const u = new URL(url);
  return u.hostname.endsWith("linkedin.com") && !u.pathname.includes("/jobs/view/");
}

export type WebStatus = { listings: JobListing[]; status: "ok" | "no-key" | "error"; error?: string };

export async function searchWeb(params: JobSearchParams): Promise<WebStatus> {
  if (!process.env.TAVILY_API_KEY) return { listings: [], status: "no-key" };

  const modeWords = params.workModes
    .map((m) => (m === "onsite" ? "on-site" : m))
    .join(" ");
  const core = `${params.company} ${params.role} ${params.location} ${modeWords}`.replace(/\s+/g, " ").trim();

  const queries: { q: string; domains?: string[] }[] = [
    { q: `${core} job`, domains: BOARD_DOMAINS },
    { q: `${core} job`, domains: ATS_DOMAINS },
    { q: `${params.company} careers ${params.role} ${params.location}`.replace(/\s+/g, " ").trim() },
  ];

  const settled = await Promise.allSettled(
    queries.map((query) =>
      tavilySearch(query.q, 8, { searchDepth: "basic", includeDomains: query.domains })
    )
  );

  const failures = settled.filter((s): s is PromiseRejectedResult => s.status === "rejected");
  const companyWords = companyCoreWords(params.company);
  const listings: JobListing[] = [];

  for (const s of settled) {
    if (s.status !== "fulfilled") continue;
    for (const r of s.value) {
      const url = safeHttpUrl(r.url);
      if (!url || isIndexPage(r.title, url)) continue;
      const haystack = normalize(`${r.title} ${r.content} ${url}`);
      if (!companyWords.every((w) => haystack.includes(w))) continue;
      if (!matchesRole(`${r.title} ${r.content}`, params.role)) continue;
      listings.push({
        id: listingId(url),
        title: r.title.trim() || url,
        company: params.company,
        location: "",
        workMode: inferWorkMode(`${r.title} ${r.content}`),
        url,
        source: sourceLabel(url),
      });
    }
  }

  if (failures.length === settled.length) {
    const reason = failures[0].reason;
    return {
      listings,
      status: "error",
      error: reason instanceof Error ? reason.message : String(reason),
    };
  }
  return { listings, status: "ok" };
}

const GENERIC_REMOTE_LOCATION = /^(remote|remoto|anywhere|worldwide|global)$/;

export function applyParamFilters(listings: JobListing[], params: JobSearchParams): JobListing[] {
  const wantedLocation = normalize(params.location).trim();
  return listings.filter((l) => {
    if (params.workModes.length > 0 && l.workMode !== "unknown" && !params.workModes.includes(l.workMode)) {
      return false;
    }
    if (wantedLocation && l.location) {
      const loc = normalize(l.location).trim();
      const genericRemote = l.workMode === "remote" && GENERIC_REMOTE_LOCATION.test(loc);
      if (!loc.includes(wantedLocation) && !genericRemote) return false;
    }
    return true;
  });
}

function dedupeKey(url: string): string {
  const u = new URL(url);
  return `${u.hostname.toLowerCase()}${u.pathname.replace(/\/+$/, "")}${u.search}`;
}

export function dedupeListings(listings: JobListing[]): JobListing[] {
  const seen = new Set<string>();
  return listings.filter((l) => {
    const key = dedupeKey(l.url);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
