import { NextRequest, NextResponse } from "next/server";
import { createTargetRole, listTargetRoles } from "@/lib/targetRole";

export async function GET() {
  const roles = await listTargetRoles();
  return NextResponse.json({ roles });
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const { companyName, companyType, clientName, roleTitle, jobDescription, cv, interviewPurpose } = body;

  if (!companyName || !roleTitle || !jobDescription || !cv) {
    return NextResponse.json(
      { error: "Campos obrigatórios: companyName, roleTitle, jobDescription, cv" },
      { status: 400 }
    );
  }

  const meta = await createTargetRole({
    companyName,
    companyType: companyType === "consultancy" ? "consultancy" : "product",
    clientName: clientName || undefined,
    roleTitle,
    jobDescription,
    cv,
    interviewPurpose: interviewPurpose || undefined,
  });

  return NextResponse.json({ meta });
}
