"use client";

import { useState, useEffect } from "react";
import { useEditorStore } from "@/lib/store";
import {
  Play,
  RotateCcw,
  Download,
  Settings,
  Loader2,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
} from "lucide-react";

interface ToolbarProps {
  showPdf: boolean;
  onTogglePdf: () => void;
}

export function Toolbar({ showPdf, onTogglePdf }: ToolbarProps) {
  const {
    isCompiling,
    compiledPdf,
    compileErrors,
    compileLogs,
    files,
    mainFile,
    apiKeys,
    selectedModel,
    setApiKeys,
    setIsCompiling,
    setCompiledPdf,
    setCompileLogs,
    setCompileErrors,
  } = useEditorStore();

  const [showSettings, setShowSettings] = useState(false);
  const [anthropicKey, setAnthropicKey] = useState(apiKeys.anthropic ?? "");
  const [openaiKey, setOpenaiKey] = useState(apiKeys.openai ?? "");
  const [lastCompileStatus, setLastCompileStatus] = useState<
    "success" | "error" | null
  >(null);

  useEffect(() => {
    setAnthropicKey(apiKeys.anthropic ?? "");
    setOpenaiKey(apiKeys.openai ?? "");
  }, [apiKeys]);

  // Listen for compile event from editor keyboard shortcut
  useEffect(() => {
    function handleCompile() {
      compile();
    }
    window.addEventListener("latex-compile", handleCompile);
    return () => window.removeEventListener("latex-compile", handleCompile);
  });

  async function compile() {
    if (isCompiling) return;
    if (!mainFile || !files[mainFile]) {
      alert("No main .tex file found. Right-click a file in the navigator to set it as main.");
      return;
    }

    setIsCompiling(true);
    setLastCompileStatus(null);

    try {
      const res = await fetch("/api/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files, mainFile }),
      });

      const data = await res.json();

      if (!res.ok) {
        setCompileLogs(data.error ?? "Compilation failed");
        setCompileErrors([data.error ?? "Unknown error"]);
        setLastCompileStatus("error");
        return;
      }

      setCompileLogs(data.logs ?? "");
      setCompileErrors(data.errors ?? []);

      if (data.success && data.pdf) {
        setCompiledPdf(data.pdf);
        setLastCompileStatus("success");
      } else {
        setLastCompileStatus("error");
      }
    } catch (err: unknown) {
      const error = err as Error;
      setCompileLogs(error.message);
      setCompileErrors([error.message]);
      setLastCompileStatus("error");
    } finally {
      setIsCompiling(false);
    }
  }

  function downloadPdf() {
    if (!compiledPdf) return;
    const bytes = atob(compiledPdf);
    const arr = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
    const blob = new Blob([arr], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "document.pdf";
    a.click();
    URL.revokeObjectURL(url);
  }

  function saveApiKeys() {
    setApiKeys({ anthropic: anthropicKey || undefined, openai: openaiKey || undefined });
    setShowSettings(false);
  }

  const activeApiKey =
    selectedModel === "claude" ? apiKeys.anthropic : apiKeys.openai;

  return (
    <>
      <header className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-[#1e1e1e] shrink-0 h-[44px]">
        {/* Left: Logo */}
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-[#007acc] rounded flex items-center justify-center">
            <span className="text-[10px] font-bold text-white">Lx</span>
          </div>
          <span className="text-sm font-semibold text-[#cccccc]">
            LaTeX AI
          </span>
        </div>

        {/* Center: Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={compile}
            disabled={isCompiling}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#007acc] hover:bg-[#1a8ad4] disabled:opacity-60 disabled:cursor-not-allowed rounded text-xs text-white font-medium transition-colors"
          >
            {isCompiling ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Play size={12} className="fill-white" />
            )}
            <span>{isCompiling ? "Compiling…" : "Compile"}</span>
          </button>

          <button
            onClick={compile}
            disabled={isCompiling}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#2d2d2d] hover:bg-[#3d3d3d] disabled:opacity-40 disabled:cursor-not-allowed rounded text-xs text-[#cccccc] transition-colors"
            title="Recompile"
          >
            <RotateCcw size={12} />
            <span>Recompile</span>
          </button>

          {/* Compile status indicator */}
          {lastCompileStatus === "success" && (
            <div className="flex items-center gap-1 text-green-400 text-xs">
              <CheckCircle size={13} />
              <span>Success</span>
            </div>
          )}
          {lastCompileStatus === "error" && (
            <div className="flex items-center gap-1 text-red-400 text-xs">
              <XCircle size={13} />
              <span>
                {compileErrors.length > 0
                  ? `${compileErrors.length} error${compileErrors.length > 1 ? "s" : ""}`
                  : "Failed"}
              </span>
            </div>
          )}
        </div>

        {/* Right: PDF toggle, download, settings */}
        <div className="flex items-center gap-1">
          <button
            onClick={onTogglePdf}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs transition-colors ${
              showPdf
                ? "bg-[#094771] text-[#007acc]"
                : "bg-[#2d2d2d] text-[#858585] hover:bg-[#3d3d3d] hover:text-[#cccccc]"
            }`}
            title="Toggle PDF preview"
          >
            {showPdf ? <Eye size={12} /> : <EyeOff size={12} />}
            <span>PDF</span>
          </button>

          <button
            onClick={downloadPdf}
            disabled={!compiledPdf}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#2d2d2d] hover:bg-[#3d3d3d] disabled:opacity-40 disabled:cursor-not-allowed rounded text-xs text-[#cccccc] transition-colors"
            title="Download PDF"
          >
            <Download size={12} />
            <span>Download</span>
          </button>

          <div className="w-px h-5 bg-[#3d3d3d] mx-1" />

          <button
            onClick={() => setShowSettings(true)}
            className={`p-1.5 rounded transition-colors ${
              !activeApiKey
                ? "text-yellow-500 hover:bg-yellow-900/20"
                : "text-[#858585] hover:bg-[#2d2d2d] hover:text-[#cccccc]"
            }`}
            title="Settings"
          >
            <Settings size={14} />
          </button>
        </div>
      </header>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#252526] border border-[#454545] rounded-lg shadow-2xl w-[420px] max-w-[90vw]">
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#3d3d3d]">
              <h2 className="text-sm font-semibold text-[#cccccc]">Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="text-[#858585] hover:text-[#cccccc] transition-colors text-lg leading-none"
              >
                ×
              </button>
            </div>

            <div className="px-5 py-4 space-y-5">
              {/* Anthropic Key */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#cccccc]">
                  Anthropic API Key
                </label>
                <p className="text-xs text-[#858585]">
                  Used for Claude models.{" "}
                  <a
                    href="https://console.anthropic.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#007acc] hover:underline"
                  >
                    Get key →
                  </a>
                </p>
                <input
                  type="password"
                  value={anthropicKey}
                  onChange={(e) => setAnthropicKey(e.target.value)}
                  placeholder="sk-ant-..."
                  className="w-full bg-[#1e1e1e] border border-[#3d3d3d] focus:border-[#007acc] rounded px-3 py-2 text-xs text-[#cccccc] outline-none placeholder-[#555] transition-colors"
                />
              </div>

              {/* OpenAI Key */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#cccccc]">
                  OpenAI API Key
                </label>
                <p className="text-xs text-[#858585]">
                  Used for GPT-4o.{" "}
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#007acc] hover:underline"
                  >
                    Get key →
                  </a>
                </p>
                <input
                  type="password"
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full bg-[#1e1e1e] border border-[#3d3d3d] focus:border-[#007acc] rounded px-3 py-2 text-xs text-[#cccccc] outline-none placeholder-[#555] transition-colors"
                />
              </div>

              {/* Compiler info */}
              <div className="bg-[#1e1e1e] rounded p-3 space-y-1">
                <p className="text-xs font-medium text-[#cccccc]">
                  LaTeX Compiler
                </p>
                <p className="text-xs text-[#858585]">
                  Uses Tectonic (via node-latex-compiler) with automatic package
                  downloads. Falls back to system pdflatex if available.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 px-5 py-4 border-t border-[#3d3d3d]">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 text-xs text-[#858585] hover:text-[#cccccc] rounded hover:bg-[#3d3d3d] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveApiKeys}
                className="px-4 py-2 text-xs bg-[#007acc] hover:bg-[#1a8ad4] text-white rounded transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
