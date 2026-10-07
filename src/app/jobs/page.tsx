import { listJobSearches } from "@/lib/jobSearch";
import JobsClient from "./JobsClient";

export const dynamic = "force-dynamic";

export default async function JobsPage() {
  const searches = await listJobSearches();
  return <JobsClient initialSearches={searches} />;
}
