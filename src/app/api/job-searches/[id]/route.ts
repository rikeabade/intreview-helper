import { NextRequest, NextResponse } from "next/server";
import {
  deleteJobSearch,
  getJobSearch,
  isValidJobSearchId,
  parseJobSearchParams,
  rerunJobSearch,
} from "@/lib/jobSearch";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const search = await getJobSearch(id);
  if (!search) return NextResponse.json({ error: "Busca não encontrada" }, { status: 404 });
  return NextResponse.json(search);
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  if (!isValidJobSearchId(id)) {
    return NextResponse.json({ error: "Busca não encontrada" }, { status: 404 });
  }
  const body = await req.json().catch(() => null);
  const nextParams = body ? parseJobSearchParams(body) : undefined;
  if (body && !nextParams) {
    return NextResponse.json({ error: "Campos obrigatórios: company, role" }, { status: 400 });
  }
  const search = await rerunJobSearch(id, nextParams ?? undefined);
  if (!search) return NextResponse.json({ error: "Busca não encontrada" }, { status: 404 });
  return NextResponse.json(search);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const ok = await deleteJobSearch(id);
  if (!ok) return NextResponse.json({ error: "Busca não encontrada" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
