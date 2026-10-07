import { NextRequest, NextResponse } from "next/server";
import { createJobSearch, listJobSearches, parseJobSearchParams } from "@/lib/jobSearch";

export async function GET() {
  return NextResponse.json({ searches: await listJobSearches() });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const params = parseJobSearchParams(body);
  if (!params) {
    return NextResponse.json({ error: "Campos obrigatórios: company, role" }, { status: 400 });
  }
  return NextResponse.json(await createJobSearch(params));
}
