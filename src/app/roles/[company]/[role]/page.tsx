import { notFound } from "next/navigation";
import { getTargetRole } from "@/lib/targetRole";
import RoleDetailClient from "./RoleDetailClient";

export default async function RolePage({
  params,
}: {
  params: Promise<{ company: string; role: string }>;
}) {
  const { company, role } = await params;
  const detail = await getTargetRole(company, role);
  if (!detail) notFound();

  return <RoleDetailClient initialDetail={detail} company={company} role={role} />;
}
