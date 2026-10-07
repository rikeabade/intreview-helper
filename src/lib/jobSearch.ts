import fs from "node:fs/promises";
import path from "node:path";
import { JOB_SEARCHES_DIR } from "./paths";
import {
  applyParamFilters,
  dedupeListings,
  searchAts,
  searchWeb,
} from "./jobSources";
import {
  SEARCHABLE_WORK_MODES,
  type JobSearch,
  type JobSearchParams,
  type SearchableWorkMode,
} from "./jobTypes";

const MAX_LISTINGS = 200;
const MAX_FIELD_LENGTH = 120;
const ID_PATTERN = /^[a-z0-9]+-[a-z0-9]+$/;

export function isValidJobSearchId(id: unknown): id is string {
  return typeof id === "string" && ID_PATTERN.test(id);
}

export function parseJobSearchParams(raw: unknown): JobSearchParams | null {
  if (!raw || typeof raw !== "object") return null;
  const body = raw as Record<string, unknown>;
  const clean = (v: unknown) => (typeof v === "string" ? v.trim().slice(0, MAX_FIELD_LENGTH) : "");

  const company = clean(body.company);
  const role = clean(body.role);
  if (!company || !role) return null;

  const requested: unknown[] = Array.isArray(body.workModes) ? body.workModes : [];
  const workModes: SearchableWorkMode[] = SEARCHABLE_WORK_MODES.filter((m) =>
    requested.includes(m)
  );

  return { company, role, location: clean(body.location), workModes };
}

function filePath(id: string): string {
  return path.join(JOB_SEARCHES_DIR, `${id}.json`);
}

async function save(search: JobSearch): Promise<void> {
  await fs.mkdir(JOB_SEARCHES_DIR, { recursive: true });
  await fs.writeFile(filePath(search.id), JSON.stringify(search, null, 2), "utf-8");
}

async function runSearch(
  params: JobSearchParams
): Promise<Pick<JobSearch, "listings" | "notes">> {
  const [ats, web] = await Promise.all([searchAts(params), searchWeb(params)]);

  const listings = dedupeListings(applyParamFilters([...ats.listings, ...web.listings], params)).slice(
    0,
    MAX_LISTINGS
  );

  return {
    listings,
    notes: { atsBoards: ats.boards, webStatus: web.status, webError: web.error },
  };
}

export async function createJobSearch(params: JobSearchParams): Promise<JobSearch> {
  const now = new Date().toISOString();
  const search: JobSearch = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    params,
    ...(await runSearch(params)),
    createdAt: now,
    searchedAt: now,
  };
  await save(search);
  return search;
}

export async function getJobSearch(id: string): Promise<JobSearch | null> {
  if (!isValidJobSearchId(id)) return null;
  try {
    return JSON.parse(await fs.readFile(filePath(id), "utf-8")) as JobSearch;
  } catch {
    return null;
  }
}

export async function rerunJobSearch(
  id: string,
  params?: JobSearchParams
): Promise<JobSearch | null> {
  const existing = await getJobSearch(id);
  if (!existing) return null;
  const nextParams = params ?? existing.params;
  const updated: JobSearch = {
    ...existing,
    params: nextParams,
    ...(await runSearch(nextParams)),
    searchedAt: new Date().toISOString(),
  };
  await save(updated);
  return updated;
}

export async function deleteJobSearch(id: string): Promise<boolean> {
  if (!isValidJobSearchId(id)) return false;
  try {
    await fs.unlink(filePath(id));
    return true;
  } catch {
    return false;
  }
}

export async function listJobSearches(): Promise<JobSearch[]> {
  let files: string[];
  try {
    files = await fs.readdir(JOB_SEARCHES_DIR);
  } catch {
    return [];
  }
  const searches: JobSearch[] = [];
  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    const search = await getJobSearch(file.slice(0, -".json".length));
    if (search) searches.push(search);
  }
  return searches.sort((a, b) => b.searchedAt.localeCompare(a.searchedAt));
}
