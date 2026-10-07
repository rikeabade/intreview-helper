export const SEARCHABLE_WORK_MODES = ["remote", "hybrid", "onsite"] as const;
export type SearchableWorkMode = (typeof SEARCHABLE_WORK_MODES)[number];
export type WorkMode = SearchableWorkMode | "unknown";

export interface JobSearchParams {
  company: string;
  role: string;
  location: string;
  workModes: SearchableWorkMode[];
}

export interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  workMode: WorkMode;
  url: string;
  source: string;
}

export interface JobSearchNotes {
  atsBoards: string[];
  webStatus: "ok" | "no-key" | "error";
  webError?: string;
}

export interface JobSearch {
  id: string;
  params: JobSearchParams;
  listings: JobListing[];
  notes: JobSearchNotes;
  createdAt: string;
  searchedAt: string;
}
