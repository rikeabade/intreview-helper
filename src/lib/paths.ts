import path from "node:path";

export const DATA_ROOT = path.join(process.cwd(), "data");

export const JOB_SEARCHES_DIR = path.join(DATA_ROOT, "_job-searches");

// Company/role slugs come from slugify(): [a-z0-9-], starting alphanumeric
// (it may end in "-" or contain "--" after truncation / collision suffixes).
const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

// Session ids are `<base36>-<base36>`; the random half can in theory be empty.
const SESSION_ID_PATTERN = /^[a-z0-9]+-[a-z0-9]*$/;

export function isValidSlug(value: unknown): value is string {
  return typeof value === "string" && SLUG_PATTERN.test(value);
}

export function isValidSessionId(value: unknown): value is string {
  return typeof value === "string" && SESSION_ID_PATTERN.test(value);
}

// Joins validated segments under DATA_ROOT and asserts the result stays inside it.
function joinInsideDataRoot(...segments: string[]): string {
  const joined = path.join(DATA_ROOT, ...segments);
  if (!joined.startsWith(DATA_ROOT + path.sep)) {
    throw new Error("Invalid path: resolved outside the data directory");
  }
  return joined;
}

export function targetRoleDir(companySlug: string, roleSlug: string): string {
  if (!isValidSlug(companySlug) || !isValidSlug(roleSlug)) {
    throw new Error("Invalid company or role slug");
  }
  return joinInsideDataRoot(companySlug, roleSlug);
}

export function sessionsDir(companySlug: string, roleSlug: string): string {
  return path.join(targetRoleDir(companySlug, roleSlug), "sessions");
}

export function sessionStateDir(
  companySlug: string,
  roleSlug: string,
  sessionId: string
): string {
  if (!isValidSessionId(sessionId)) {
    throw new Error("Invalid session id");
  }
  return path.join(sessionsDir(companySlug, roleSlug), sessionId);
}
