import path from "path";
import fs from "fs/promises";
import fsSync from "fs";
import os from "os";
import { createCompiler } from "node-latex-compiler";

interface CompileResult {
  pdf: Buffer | null;
  logs: string;
  errors: string[];
  success: boolean;
}

export async function compileLaTeX(
  files: Record<string, string>,
  mainFile: string
): Promise<CompileResult> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "latex-ai-"));

  try {
    // Write all files to temp directory
    for (const [name, content] of Object.entries(files)) {
      const filePath = path.join(tmpDir, name);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, content, "utf-8");
    }

    const mainFilePath = path.join(tmpDir, mainFile);
    const outputPdfPath = path.join(tmpDir, "output.pdf");

    // Use node-latex-compiler (Tectonic)
    try {
      const compiler = createCompiler();
      const result = await compiler.compile({
        texFile: mainFilePath,
        outputFile: outputPdfPath,
        returnBuffer: true,
      });

      const logs = (result.stdout ?? "") + "\n" + (result.stderr ?? "");
      const errors = extractErrors(logs);

      if (result.status === "success") {
        let pdfBuffer: Buffer | null = result.pdfBuffer ?? null;

        // If no buffer returned, try reading from output path
        if (!pdfBuffer && fsSync.existsSync(outputPdfPath)) {
          pdfBuffer = await fs.readFile(outputPdfPath);
        }

        // Final fallback: any .pdf in tmpDir
        if (!pdfBuffer) {
          const dirFiles = await fs.readdir(tmpDir);
          const pdfFile = dirFiles.find((f) => f.endsWith(".pdf"));
          if (pdfFile) {
            pdfBuffer = await fs.readFile(path.join(tmpDir, pdfFile));
          }
        }

        return { pdf: pdfBuffer, logs, errors, success: pdfBuffer !== null };
      } else {
        return {
          pdf: null,
          logs,
          errors: errors.length > 0 ? errors : [result.error ?? "Compilation failed"],
          success: false,
        };
      }
    } catch (tectonicErr: unknown) {
      // Tectonic failed — try system pdflatex as fallback
      console.warn("Tectonic failed, trying pdflatex:", tectonicErr);
      return await runPdflatex(mainFilePath, tmpDir);
    }
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
}

async function runPdflatex(
  mainFilePath: string,
  workDir: string
): Promise<CompileResult> {
  const { exec } = await import("child_process");
  const { promisify } = await import("util");
  const execAsync = promisify(exec);

  try {
    const { stdout, stderr } = await execAsync(
      `pdflatex -interaction=nonstopmode -output-directory="${workDir}" "${mainFilePath}"`,
      { cwd: workDir, timeout: 60000 }
    );

    const logs = stdout + "\n" + stderr;
    const errors = extractErrors(logs);

    const pdfName = path.basename(mainFilePath).replace(/\.tex$/, ".pdf");
    const pdfPath = path.join(workDir, pdfName);

    let pdfBuffer: Buffer | null = null;
    if (fsSync.existsSync(pdfPath)) {
      pdfBuffer = await fs.readFile(pdfPath);
    }

    return { pdf: pdfBuffer, logs, errors, success: pdfBuffer !== null };
  } catch (err: unknown) {
    const error = err as { stdout?: string; stderr?: string; message?: string };
    const logs =
      (error.stdout ?? "") + "\n" + (error.stderr ?? error.message ?? "");
    return {
      pdf: null,
      logs,
      errors: extractErrors(logs),
      success: false,
    };
  }
}

function extractErrors(logs: string): string[] {
  const errorLines: string[] = [];
  const lines = logs.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (
      line.startsWith("!") ||
      line.match(/error:/i) ||
      line.match(/fatal error/i)
    ) {
      errorLines.push(line.trim());
      if (i + 1 < lines.length && lines[i + 1].trim()) {
        errorLines.push(lines[i + 1].trim());
      }
    }
  }

  return errorLines.filter(Boolean);
}
