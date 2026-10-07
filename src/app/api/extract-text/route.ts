import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    try {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      return NextResponse.json({ text: result.text });
    } catch (err) {
      console.error("Falha ao extrair texto do PDF:", err);
      return NextResponse.json(
        { error: "Não consegui ler esse PDF. Tente colar o texto diretamente." },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ text: buffer.toString("utf-8") });
}
