import { NextRequest, NextResponse } from "next/server";
import { getTargetRole, writeResearchDossier } from "@/lib/targetRole";
import { runResearch } from "@/lib/research";
import { DEFAULT_LOCALE, isLocale } from "@/lib/locale";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ company: string; role: string }> }
) {
  const { company, role } = await params;
  const detail = await getTargetRole(company, role);
  if (!detail) {
    return NextResponse.json({ error: "Target Role not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const locale = isLocale(body.locale) ? body.locale : DEFAULT_LOCALE;

  try {
    const dossier = await runResearch(detail.meta, locale, detail.interviewPurpose);
    await writeResearchDossier(company, role, dossier);
    return NextResponse.json({ researchDossier: dossier });
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : locale === "en"
          ? "Unknown error during research"
          : "Erro desconhecido na pesquisa";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
