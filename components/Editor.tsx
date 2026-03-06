"use client";

import { useRef, useCallback, useEffect } from "react";
import MonacoEditor, { OnMount } from "@monaco-editor/react";
import { useEditorStore } from "@/lib/store";
import { registerLatexLanguage } from "@/lib/monaco-latex";
import { X, FileText } from "lucide-react";
import type * as Monaco from "monaco-editor";

interface HighlightLineEvent extends CustomEvent {
  detail: { file: string; line: number };
}

interface JumpToLineEvent extends CustomEvent {
  detail: { file: string; line: number };
}

export function Editor() {
  const {
    files,
    activeFile,
    openFiles,
    mainFile,
    setFileContent,
    openFile,
    closeFile,
  } = useEditorStore();

  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof Monaco | null>(null);
  const decorationIdsRef = useRef<string[]>([]);
  const hoverClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleEditorMount: OnMount = useCallback(
    (editor, monaco) => {
      editorRef.current = editor;
      monacoRef.current = monaco;

      registerLatexLanguage(monaco);
      monaco.editor.setTheme("latex-dark");

      // Cmd/Ctrl+Enter to trigger compile (dispatches custom event)
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
        () => {
          window.dispatchEvent(new CustomEvent("latex-compile"));
        }
      );

      // Cmd/Ctrl+S also triggers compile
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
        () => {
          window.dispatchEvent(new CustomEvent("latex-compile"));
        }
      );
    },
    []
  );

  const applyHighlight = useCallback((line: number) => {
    const editor = editorRef.current;
    if (!editor) return;
    const model = editor.getModel();
    if (!model) return;
    const maxCol = model.getLineMaxColumn(line);
    const range = {
      startLineNumber: line,
      startColumn: 1,
      endLineNumber: line,
      endColumn: maxCol,
    };
    decorationIdsRef.current = editor.deltaDecorations(decorationIdsRef.current, [
      {
        range,
        options: {
          isWholeLine: true,
          className: "synctex-highlight",
          overviewRuler: { color: "#fbbf24", position: 1 },
        },
      },
    ]);
    editor.revealLineInCenter(line, 0);
  }, []);

  const clearHighlight = useCallback(() => {
    if (editorRef.current) {
      decorationIdsRef.current = editorRef.current.deltaDecorations(
        decorationIdsRef.current,
        []
      );
    }
  }, []);

  // Listen for hover highlight events from PDFPreview
  useEffect(() => {
    const handleHighlight = (e: Event) => {
      const { file, line } = (e as HighlightLineEvent).detail;
      if (hoverClearTimerRef.current) clearTimeout(hoverClearTimerRef.current);
      // Switch to target file if needed
      if (file !== useEditorStore.getState().activeFile) {
        useEditorStore.getState().openFile(file);
        // Slight delay so Monaco updates its model before we decorate
        setTimeout(() => applyHighlight(line), 80);
      } else {
        applyHighlight(line);
      }
      // Auto-clear after 2 seconds
      hoverClearTimerRef.current = setTimeout(clearHighlight, 2000);
    };

    const handleJump = (e: Event) => {
      const { file, line } = (e as JumpToLineEvent).detail;
      if (hoverClearTimerRef.current) clearTimeout(hoverClearTimerRef.current);
      if (file !== useEditorStore.getState().activeFile) {
        useEditorStore.getState().openFile(file);
        setTimeout(() => {
          applyHighlight(line);
          editorRef.current?.focus();
        }, 80);
      } else {
        applyHighlight(line);
        editorRef.current?.focus();
      }
    };

    window.addEventListener("editor-highlight-line", handleHighlight);
    window.addEventListener("editor-jump-to-line", handleJump);
    return () => {
      window.removeEventListener("editor-highlight-line", handleHighlight);
      window.removeEventListener("editor-jump-to-line", handleJump);
      if (hoverClearTimerRef.current) clearTimeout(hoverClearTimerRef.current);
    };
  }, [applyHighlight, clearHighlight]);

  // When active file changes, update the model in Monaco
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current || !activeFile) return;

    const monaco = monacoRef.current;
    const editor = editorRef.current;
    const content = files[activeFile] ?? "";

    const modelUri = monaco.Uri.parse(`file:///${activeFile}`);
    let model = monaco.editor.getModel(modelUri);

    if (!model) {
      const lang = getLanguage(activeFile);
      model = monaco.editor.createModel(content, lang, modelUri);
    } else if (model.getValue() !== content) {
      model.setValue(content);
    }

    editor.setModel(model);
  }, [activeFile, files]);

  function getLanguage(filename: string): string {
    if (filename.endsWith(".tex") || filename.endsWith(".cls") || filename.endsWith(".sty")) {
      return "latex";
    }
    if (filename.endsWith(".bib")) return "bibtex";
    if (filename.endsWith(".json")) return "json";
    if (filename.endsWith(".md")) return "markdown";
    return "plaintext";
  }

  function handleChange(value: string | undefined) {
    if (activeFile && value !== undefined) {
      setFileContent(activeFile, value);
    }
  }

  const currentContent = activeFile ? (files[activeFile] ?? "") : "";
  const currentLanguage = activeFile ? getLanguage(activeFile) : "plaintext";

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      {/* Tabs */}
      <div className="flex items-center overflow-x-auto bg-[#0a0a0a] border-b border-[#1a1a1a] min-h-[38px] scrollbar-hide">
        {openFiles.map((name) => (
          <div
            key={name}
            className={`group flex items-center gap-1.5 px-3 py-2 cursor-pointer text-xs whitespace-nowrap transition-colors min-w-0 rounded-t-lg mx-0.5 ${
              activeFile === name
                ? "bg-[#1a1a1a] text-white"
                : "bg-transparent text-[#666] hover:bg-[#1a1a1a]/50 hover:text-white"
            }`}
            onClick={() => openFile(name)}
          >
            <FileText
              size={12}
              className={
                name.endsWith(".tex")
                  ? "text-[#fbbf24]"
                  : "text-[#666]"
              }
            />
            <span className="max-w-[140px] truncate">
              {name}
              {name === mainFile && (
                <span className="ml-1 text-[10px] text-[#fbbf24]">★</span>
              )}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeFile(name);
              }}
              className="opacity-0 group-hover:opacity-100 hover:bg-[#333] rounded p-0.5 transition-all -mr-1 shrink-0"
            >
              <X size={10} />
            </button>
          </div>
        ))}
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 min-h-0">
        {activeFile ? (
          <MonacoEditor
            height="100%"
            language={currentLanguage}
            value={currentContent}
            onChange={handleChange}
            onMount={handleEditorMount}
            theme="latex-dark"
            options={{
              fontSize: 14,
              fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
              fontLigatures: true,
              lineHeight: 22,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              wordWrap: "on",
              wrappingIndent: "indent",
              autoIndent: "full",
              tabSize: 2,
              insertSpaces: true,
              renderLineHighlight: "line",
              cursorBlinking: "smooth",
              cursorSmoothCaretAnimation: "on",
              smoothScrolling: true,
              padding: { top: 16, bottom: 16 },
              lineNumbers: "on",
              glyphMargin: false,
              folding: true,
              bracketPairColorization: { enabled: true },
              suggest: { showSnippets: true },
              quickSuggestions: {
                other: true,
                comments: false,
                strings: false,
              },
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-[#666] text-sm">
            <div className="text-center space-y-2">
              <FileText size={32} className="mx-auto opacity-30" />
              <p className="text-[#888]">No file open</p>
              <p className="text-xs">Select a file from the navigator</p>
            </div>
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-3 py-1 bg-[#fbbf24] text-black text-xs font-medium">
        <div className="flex items-center gap-3">
          <span>{activeFile ?? "No file"}</span>
          {activeFile === mainFile && (
            <span className="text-black/60 text-[10px]">★ main</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span>LaTeX</span>
          <span>UTF-8</span>
          <span className="opacity-60 text-[10px]">⌘↵ Compile</span>
        </div>
      </div>
    </div>
  );
}
