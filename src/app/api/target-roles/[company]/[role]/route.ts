import { NextRequest, NextResponse } from "next/server";
import {
  deleteTargetRole,
  getTargetRole,
  updateTargetRoleField,
  type EditableTargetRoleField,
} from "@/lib/targetRole";

const EDITABLE_FIELDS: EditableTargetRoleField[] = [
  "jobDescription",
  "cv",
  "interviewPurpose",
  "researchDossier",
];

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ company: string; role: string }> }
) {
  const { company, role } = await params;
  const detail = await getTargetRole(company, role);
  if (!detail) {
    return NextResponse.json({ error: "Target Role not found" }, { status: 404 });
  }
  return NextResponse.json(detail);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ company: string; role: string }> }
) {
  const { company, role } = await params;
  const deleted = await deleteTargetRole(company, role);
  if (!deleted) {
    return NextResponse.json({ error: "Target Role not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ company: string; role: string }> }
) {
  const { company, role } = await params;
  const body = await req.json();
  const { field, content } = body;

  if (!EDITABLE_FIELDS.includes(field) || typeof content !== "string") {
    return NextResponse.json({ error: "Invalid field." }, { status: 400 });
  }

  const existing = await getTargetRole(company, role);
  if (!existing) {
    return NextResponse.json({ error: "Target Role not found" }, { status: 404 });
  }

  await updateTargetRoleField(company, role, field, content);
  const detail = await getTargetRole(company, role);
  return NextResponse.json(detail);
}
