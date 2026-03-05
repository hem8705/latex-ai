"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { FileMap, Message, ApiKeys, AIModel } from "@/types";

const DEFAULT_MAIN_TEX = `\\documentclass[12pt]{article}

\\usepackage{amsmath}
\\usepackage{amssymb}
\\usepackage{geometry}
\\geometry{margin=1in}

\\title{My Document}
\\author{Author Name}
\\date{\\today}

\\begin{document}

\\maketitle

\\section{Introduction}
Hello, \\LaTeX! This is your first document.

\\section{Mathematics}
Here is an inline equation: $E = mc^2$.

And a display equation:
\\[
  \\int_0^\\infty e^{-x^2}\\,dx = \\frac{\\sqrt{\\pi}}{2}
\\]

\\section{Conclusion}
Edit this document and click \\textbf{Compile} to see the PDF.

\\end{document}
`;

interface EditorStore {
  // Files
  files: FileMap;
  activeFile: string | null;
  openFiles: string[];

  // Compilation
  compiledPdf: string | null;
  isCompiling: boolean;
  compileLogs: string;
  compileErrors: string[];
  mainFile: string;

  // AI
  aiMessages: Message[];
  selectedModel: AIModel;
  apiKeys: ApiKeys;
  isAiLoading: boolean;

  // Actions — Files
  setFileContent: (name: string, content: string) => void;
  addFile: (name: string, content?: string) => void;
  deleteFile: (name: string) => void;
  renameFile: (oldName: string, newName: string) => void;
  setActiveFile: (name: string) => void;
  openFile: (name: string) => void;
  closeFile: (name: string) => void;
  setMainFile: (name: string) => void;

  // Actions — Compilation
  setCompiledPdf: (pdf: string | null) => void;
  setIsCompiling: (v: boolean) => void;
  setCompileLogs: (logs: string) => void;
  setCompileErrors: (errors: string[]) => void;

  // Actions — AI
  addAiMessage: (message: Message) => void;
  updateLastAiMessage: (content: string) => void;
  clearAiMessages: () => void;
  setSelectedModel: (model: AIModel) => void;
  setApiKeys: (keys: Partial<ApiKeys>) => void;
  setIsAiLoading: (v: boolean) => void;
}

export const useEditorStore = create<EditorStore>()(
  persist(
    (set, get) => ({
      // Initial state
      files: { "main.tex": DEFAULT_MAIN_TEX },
      activeFile: "main.tex",
      openFiles: ["main.tex"],
      compiledPdf: null,
      isCompiling: false,
      compileLogs: "",
      compileErrors: [],
      mainFile: "main.tex",
      aiMessages: [],
      selectedModel: "claude",
      apiKeys: {},
      isAiLoading: false,

      // File actions
      setFileContent: (name, content) =>
        set((s) => ({ files: { ...s.files, [name]: content } })),

      addFile: (name, content = "") => {
        const { files, openFiles } = get();
        if (files[name] !== undefined) return;
        set({
          files: { ...files, [name]: content },
          openFiles: openFiles.includes(name)
            ? openFiles
            : [...openFiles, name],
          activeFile: name,
        });
      },

      deleteFile: (name) => {
        const { files, openFiles, activeFile, mainFile } = get();
        const newFiles = { ...files };
        delete newFiles[name];
        const newOpen = openFiles.filter((f) => f !== name);
        const newActive =
          activeFile === name ? (newOpen[0] ?? null) : activeFile;
        set({
          files: newFiles,
          openFiles: newOpen,
          activeFile: newActive,
          mainFile: mainFile === name ? (newOpen[0] ?? "main.tex") : mainFile,
        });
      },

      renameFile: (oldName, newName) => {
        const { files, openFiles, activeFile, mainFile } = get();
        const newFiles = { ...files, [newName]: files[oldName] };
        delete newFiles[oldName];
        set({
          files: newFiles,
          openFiles: openFiles.map((f) => (f === oldName ? newName : f)),
          activeFile: activeFile === oldName ? newName : activeFile,
          mainFile: mainFile === oldName ? newName : mainFile,
        });
      },

      setActiveFile: (name) => set({ activeFile: name }),

      openFile: (name) => {
        const { openFiles } = get();
        set({
          openFiles: openFiles.includes(name) ? openFiles : [...openFiles, name],
          activeFile: name,
        });
      },

      closeFile: (name) => {
        const { openFiles, activeFile } = get();
        const newOpen = openFiles.filter((f) => f !== name);
        const newActive =
          activeFile === name ? (newOpen[newOpen.length - 1] ?? null) : activeFile;
        set({ openFiles: newOpen, activeFile: newActive });
      },

      setMainFile: (name) => set({ mainFile: name }),

      // Compilation actions
      setCompiledPdf: (pdf) => set({ compiledPdf: pdf }),
      setIsCompiling: (v) => set({ isCompiling: v }),
      setCompileLogs: (logs) => set({ compileLogs: logs }),
      setCompileErrors: (errors) => set({ compileErrors: errors }),

      // AI actions
      addAiMessage: (message) =>
        set((s) => ({ aiMessages: [...s.aiMessages, message] })),

      updateLastAiMessage: (content) =>
        set((s) => {
          const msgs = [...s.aiMessages];
          if (msgs.length > 0 && msgs[msgs.length - 1].role === "assistant") {
            msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content };
          }
          return { aiMessages: msgs };
        }),

      clearAiMessages: () => set({ aiMessages: [] }),
      setSelectedModel: (model) => set({ selectedModel: model }),
      setApiKeys: (keys) =>
        set((s) => ({ apiKeys: { ...s.apiKeys, ...keys } })),
      setIsAiLoading: (v) => set({ isAiLoading: v }),
    }),
    {
      name: "latex-ai-store",
      partialize: (s) => ({
        files: s.files,
        mainFile: s.mainFile,
        apiKeys: s.apiKeys,
        selectedModel: s.selectedModel,
      }),
    }
  )
);
