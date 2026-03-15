import { NextRequest } from "next/server";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return new Response(
        JSON.stringify({ error: "No file provided" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const fileName = file.name.toLowerCase();
    let extractedText = "";

    if (fileName.endsWith(".txt") || fileName.endsWith(".md") || fileName.endsWith(".tex")) {
      extractedText = await file.text();
    } else if (fileName.endsWith(".pdf")) {
      extractedText = await extractPdfText(file);
    } else if (fileName.endsWith(".docx")) {
      extractedText = await extractDocxText(file);
    } else if (fileName.endsWith(".doc")) {
      return new Response(
        JSON.stringify({ error: "Legacy .doc files are not supported. Please convert to .docx" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    } else {
      return new Response(
        JSON.stringify({ error: "Unsupported file type" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ 
        text: extractedText,
        fileName: file.name,
        size: file.size,
        type: file.type
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Extraction error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

async function extractPdfText(file: File): Promise<string> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfParseModule = await import("pdf-parse") as any;
    const pdfParse = pdfParseModule.default || pdfParseModule;
    const buffer = Buffer.from(await file.arrayBuffer());
    const data = await pdfParse(buffer);
    return data.text;
  } catch (err) {
    console.error("PDF extraction error:", err);
    return `[Unable to extract text from PDF: ${file.name}]`;
  }
}

async function extractDocxText(file: File): Promise<string> {
  try {
    const mammoth = await import("mammoth");
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (err) {
    console.error("DOCX extraction error:", err);
    return `[Unable to extract text from DOCX: ${file.name}]`;
  }
}
