import { NextRequest, NextResponse } from "next/server";
import { compileLaTeX } from "@/lib/latex";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { files, mainFile } = body as {
      files: Record<string, string>;
      mainFile: string;
    };

    if (!files || !mainFile) {
      return NextResponse.json(
        { error: "Missing files or mainFile" },
        { status: 400 }
      );
    }

    if (!files[mainFile]) {
      return NextResponse.json(
        { error: `Main file "${mainFile}" not found` },
        { status: 400 }
      );
    }

    const result = await compileLaTeX(files, mainFile);

    return NextResponse.json({
      pdf: result.pdf ? result.pdf.toString("base64") : null,
      logs: result.logs,
      errors: result.errors,
      success: result.success,
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Compile error:", error);
    return NextResponse.json(
      { error: error.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
