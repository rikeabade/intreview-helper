import { notFound } from "next/navigation";
import { getTargetRole } from "@/lib/targetRole";
import { loadState } from "@/lib/interview";
import { isValidSessionId, isValidSlug } from "@/lib/paths";
import SessionClient from "./SessionClient";

export default async function SessionPage({
  params,
}: {
  params: Promise<{ company: string; role: string; sessionId: string }>;
}) {
  const { company, role, sessionId } = await params;
  if (!isValidSlug(company) || !isValidSlug(role) || !isValidSessionId(sessionId)) notFound();

  const [detail, state] = await Promise.all([
    getTargetRole(company, role),
    loadState(company, role, sessionId),
  ]);

  if (!detail || !state) notFound();

  return (
    <SessionClient
      initialState={state}
      jobDescription={detail.jobDescription}
      cv={detail.cv}
      company={company}
      role={role}
    />
  );
}
