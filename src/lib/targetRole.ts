import fs from "node:fs/promises";
import path from "node:path";
import { DATA_ROOT, isValidSlug, targetRoleDir } from "./paths";
import { slugify } from "./slug";

export type CompanyType = "product" | "consultancy";

export interface TargetRoleMeta {
  companySlug: string;
  roleSlug: string;
  companyName: string;
  companyType: CompanyType;
  clientName?: string;
  roleTitle: string;
  createdAt: string;
}

export interface CreateTargetRoleInput {
  companyName: string;
  companyType: CompanyType;
  clientName?: string;
  roleTitle: string;
  jobDescription: string;
  cv: string;
  interviewPurpose?: string;
}

const META_FILE = "meta.json";
const JD_FILE = "job-description.md";
const CV_FILE = "cv.md";
const DOSSIER_FILE = "research-dossier.md";
const INTERVIEW_PURPOSE_FILE = "interview-purpose.md";

export type EditableTargetRoleField = "jobDescription" | "cv" | "interviewPurpose" | "researchDossier";

const EDITABLE_FIELD_FILES: Record<EditableTargetRoleField, string> = {
  jobDescription: JD_FILE,
  cv: CV_FILE,
  interviewPurpose: INTERVIEW_PURPOSE_FILE,
  researchDossier: DOSSIER_FILE,
};

async function exists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

export async function createTargetRole(
  input: CreateTargetRoleInput
): Promise<TargetRoleMeta> {
  const companySlug = slugify(input.companyName);
  let roleSlug = slugify(input.roleTitle);

  const dir = targetRoleDir(companySlug, roleSlug);
  if (await exists(dir)) {
    roleSlug = `${roleSlug}-${Date.now().toString(36)}`;
  }

  const finalDir = targetRoleDir(companySlug, roleSlug);
  await fs.mkdir(finalDir, { recursive: true });

  const meta: TargetRoleMeta = {
    companySlug,
    roleSlug,
    companyName: input.companyName,
    companyType: input.companyType,
    clientName: input.clientName,
    roleTitle: input.roleTitle,
    createdAt: new Date().toISOString(),
  };

  await fs.writeFile(
    path.join(finalDir, META_FILE),
    JSON.stringify(meta, null, 2),
    "utf-8"
  );
  await fs.writeFile(path.join(finalDir, JD_FILE), input.jobDescription, "utf-8");
  await fs.writeFile(path.join(finalDir, CV_FILE), input.cv, "utf-8");
  if (input.interviewPurpose?.trim()) {
    await fs.writeFile(path.join(finalDir, INTERVIEW_PURPOSE_FILE), input.interviewPurpose, "utf-8");
  }

  return meta;
}

export async function listTargetRoles(): Promise<TargetRoleMeta[]> {
  const results: TargetRoleMeta[] = [];
  if (!(await exists(DATA_ROOT))) return results;

  const companies = await fs.readdir(DATA_ROOT, { withFileTypes: true });
  for (const company of companies) {
    if (!company.isDirectory()) continue;
    const companyPath = path.join(DATA_ROOT, company.name);
    const roles = await fs.readdir(companyPath, { withFileTypes: true });
    for (const role of roles) {
      if (!role.isDirectory()) continue;
      const metaPath = path.join(companyPath, role.name, META_FILE);
      if (await exists(metaPath)) {
        const raw = await fs.readFile(metaPath, "utf-8");
        results.push(JSON.parse(raw) as TargetRoleMeta);
      }
    }
  }

  return results.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export interface TargetRoleDetail {
  meta: TargetRoleMeta;
  jobDescription: string;
  cv: string;
  researchDossier: string | null;
  interviewPurpose: string | null;
}

export async function getTargetRole(
  companySlug: string,
  roleSlug: string
): Promise<TargetRoleDetail | null> {
  if (!isValidSlug(companySlug) || !isValidSlug(roleSlug)) return null;
  const dir = targetRoleDir(companySlug, roleSlug);
  const metaPath = path.join(dir, META_FILE);
  if (!(await exists(metaPath))) return null;

  const meta = JSON.parse(await fs.readFile(metaPath, "utf-8")) as TargetRoleMeta;
  const jobDescription = await fs.readFile(path.join(dir, JD_FILE), "utf-8");
  const cv = await fs.readFile(path.join(dir, CV_FILE), "utf-8");

  const dossierPath = path.join(dir, DOSSIER_FILE);
  const researchDossier = (await exists(dossierPath))
    ? await fs.readFile(dossierPath, "utf-8")
    : null;

  const purposePath = path.join(dir, INTERVIEW_PURPOSE_FILE);
  const interviewPurpose = (await exists(purposePath))
    ? await fs.readFile(purposePath, "utf-8")
    : null;

  return { meta, jobDescription, cv, researchDossier, interviewPurpose };
}

// Deletes the whole role (meta, JD, CV, dossier, purpose and every session). It only
// acts on folders that exist as a role (they have meta.json) and whose slugs pass validation.
export async function deleteTargetRole(
  companySlug: string,
  roleSlug: string
): Promise<boolean> {
  if (!isValidSlug(companySlug) || !isValidSlug(roleSlug)) return false;
  const dir = targetRoleDir(companySlug, roleSlug);
  if (!(await exists(path.join(dir, META_FILE)))) return false;

  await fs.rm(dir, { recursive: true, force: true });

  // If the company is left with no roles, remove its empty folder (rmdir only removes empty folders).
  try {
    await fs.rmdir(path.dirname(dir));
  } catch {
    // the company still has other roles
  }
  return true;
}

export async function writeResearchDossier(
  companySlug: string,
  roleSlug: string,
  content: string
): Promise<void> {
  await updateTargetRoleField(companySlug, roleSlug, "researchDossier", content);
}

export async function updateTargetRoleField(
  companySlug: string,
  roleSlug: string,
  field: EditableTargetRoleField,
  content: string
): Promise<void> {
  const dir = targetRoleDir(companySlug, roleSlug);
  await fs.writeFile(path.join(dir, EDITABLE_FIELD_FILES[field]), content, "utf-8");
}
