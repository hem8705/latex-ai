"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { FileMap, Message, ApiKeys, AIModel, Project } from "@/types";

export const DEFAULT_MAIN_TEX = `\\documentclass[12pt]{article}

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

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

interface SourceLocation {
  file: string;
  line: number;
}

interface EditorStore {
  // Projects
  projects: Project[];
  activeProjectId: string | null;

  // Working copy (current open project's files)
  files: FileMap;
  activeFile: string | null;
  openFiles: string[];
  mainFile: string;

  // Compilation
  compiledPdf: string | null;
  isCompiling: boolean;
  compileLogs: string;
  compileErrors: string[];

  // Source highlighting (PDF → editor)
  highlightedLine: SourceLocation | null;

  // AI
  aiMessages: Message[];
  selectedModel: AIModel;
  apiKeys: ApiKeys;
  isAiLoading: boolean;

  // Actions — Projects
  createProject: (name: string) => void;
  openProject: (id: string) => void;
  closeProject: () => void;
  deleteProject: (id: string) => void;
  renameProject: (id: string, name: string) => void;

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

  // Actions — Source highlighting
  setHighlightedLine: (loc: SourceLocation | null) => void;
  findSourceLine: (text: string) => SourceLocation | null;

  // Actions — AI
  addAiMessage: (message: Message) => void;
  updateLastAiMessage: (content: string) => void;
  clearAiMessages: () => void;
  setSelectedModel: (model: AIModel) => void;
  setApiKeys: (keys: Partial<ApiKeys>) => void;
  setIsAiLoading: (v: boolean) => void;
}

/** Sync the current working files back into the projects array */
function syncActiveProject(
  projects: Project[],
  activeProjectId: string | null,
  files: FileMap,
  mainFile: string
): Project[] {
  if (!activeProjectId) return projects;
  return projects.map((p) =>
    p.id === activeProjectId
      ? { ...p, files, mainFile, updatedAt: Date.now() }
      : p
  );
}

export const useEditorStore = create<EditorStore>()(
  persist(
    (set, get) => ({
      // Initial state
      projects: [],
      activeProjectId: null,
      files: { "main.tex": DEFAULT_MAIN_TEX },
      activeFile: "main.tex",
      openFiles: ["main.tex"],
      compiledPdf: null,
      isCompiling: false,
      compileLogs: "",
      compileErrors: [],
      mainFile: "main.tex",
      highlightedLine: null,
      aiMessages: [],
      selectedModel: "claude",
      apiKeys: {},
      isAiLoading: false,

      // Project actions
      createProject: (name) => {
        const now = Date.now();
        const newProject: Project = {
          id: generateId(),
          name,
          files: { "main.tex": DEFAULT_MAIN_TEX },
          mainFile: "main.tex",
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({
          projects: [...s.projects, newProject],
          activeProjectId: newProject.id,
          files: { ...newProject.files },
          mainFile: newProject.mainFile,
          activeFile: "main.tex",
          openFiles: ["main.tex"],
          compiledPdf: null,
          compileLogs: "",
          compileErrors: [],
          aiMessages: [],
        }));
      },

      openProject: (id) => {
        const { projects, files, mainFile, activeProjectId } = get();
        // Save current working copy back before switching
        const savedProjects = syncActiveProject(projects, activeProjectId, files, mainFile);
        const project = savedProjects.find((p) => p.id === id);
        if (!project) return;
        const firstFile = Object.keys(project.files)[0] ?? null;
        set({
          projects: savedProjects,
          activeProjectId: id,
          files: { ...project.files },
          mainFile: project.mainFile,
          activeFile: project.mainFile ?? firstFile,
          openFiles: project.mainFile ? [project.mainFile] : firstFile ? [firstFile] : [],
          compiledPdf: null,
          compileLogs: "",
          compileErrors: [],
          aiMessages: [],
        });
      },

      closeProject: () => {
        const { projects, files, mainFile, activeProjectId } = get();
        const savedProjects = syncActiveProject(projects, activeProjectId, files, mainFile);
        set({
          projects: savedProjects,
          activeProjectId: null,
          compiledPdf: null,
          compileLogs: "",
          compileErrors: [],
          aiMessages: [],
        });
      },

      deleteProject: (id) => {
        set((s) => ({
          projects: s.projects.filter((p) => p.id !== id),
          // If we deleted the active project, go back to dashboard
          ...(s.activeProjectId === id ? { activeProjectId: null } : {}),
        }));
      },

      renameProject: (id, name) => {
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id ? { ...p, name, updatedAt: Date.now() } : p
          ),
        }));
      },

      // File actions — write-through to projects when a project is active
      setFileContent: (name, content) =>
        set((s) => {
          const newFiles = { ...s.files, [name]: content };
          return {
            files: newFiles,
            projects: syncActiveProject(s.projects, s.activeProjectId, newFiles, s.mainFile),
          };
        }),

      addFile: (name, content = "") => {
        const { files, openFiles, projects, activeProjectId, mainFile } = get();
        if (files[name] !== undefined) return;
        const newFiles = { ...files, [name]: content };
        set({
          files: newFiles,
          openFiles: openFiles.includes(name) ? openFiles : [...openFiles, name],
          activeFile: name,
          projects: syncActiveProject(projects, activeProjectId, newFiles, mainFile),
        });
      },

      deleteFile: (name) => {
        const { files, openFiles, activeFile, mainFile, projects, activeProjectId } = get();
        const newFiles = { ...files };
        delete newFiles[name];
        const newOpen = openFiles.filter((f) => f !== name);
        const newActive = activeFile === name ? (newOpen[0] ?? null) : activeFile;
        const newMain = mainFile === name ? (newOpen[0] ?? "main.tex") : mainFile;
        set({
          files: newFiles,
          openFiles: newOpen,
          activeFile: newActive,
          mainFile: newMain,
          projects: syncActiveProject(projects, activeProjectId, newFiles, newMain),
        });
      },

      renameFile: (oldName, newName) => {
        const { files, openFiles, activeFile, mainFile, projects, activeProjectId } = get();
        const newFiles = { ...files, [newName]: files[oldName] };
        delete newFiles[oldName];
        const newMain = mainFile === oldName ? newName : mainFile;
        set({
          files: newFiles,
          openFiles: openFiles.map((f) => (f === oldName ? newName : f)),
          activeFile: activeFile === oldName ? newName : activeFile,
          mainFile: newMain,
          projects: syncActiveProject(projects, activeProjectId, newFiles, newMain),
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

      setMainFile: (name) =>
        set((s) => {
          const projects = syncActiveProject(s.projects, s.activeProjectId, s.files, name);
          return { mainFile: name, projects };
        }),

      // Compilation actions
      setCompiledPdf: (pdf) => set({ compiledPdf: pdf }),
      setIsCompiling: (v) => set({ isCompiling: v }),
      setCompileLogs: (logs) => set({ compileLogs: logs }),
      setCompileErrors: (errors) => set({ compileErrors: errors }),

      // Source highlighting actions
      setHighlightedLine: (loc) => set({ highlightedLine: loc }),

      findSourceLine: (text: string): SourceLocation | null => {
        const { files, mainFile } = get();
        const needle = text.trim().replace(/\s+/g, " ");
        if (needle.length < 3) return null;

        const orderedFiles = [
          mainFile,
          ...Object.keys(files).filter(
            (f) => f !== mainFile && (f.endsWith(".tex") || f.endsWith(".sty") || f.endsWith(".cls"))
          ),
        ];

        for (const filename of orderedFiles) {
          const content = files[filename];
          if (!content) continue;
          const lines = content.split("\n");
          for (let i = 0; i < lines.length; i++) {
            const normalized = lines[i].replace(/\s+/g, " ").trim();
            if (normalized.length >= 3 && normalized.includes(needle)) {
              return { file: filename, line: i + 1 };
            }
          }
          if (needle.length >= 8) {
            const partial = needle.slice(0, Math.floor(needle.length * 0.6));
            for (let i = 0; i < lines.length; i++) {
              const normalized = lines[i].replace(/\s+/g, " ").trim();
              if (normalized.length >= 3 && normalized.includes(partial)) {
                return { file: filename, line: i + 1 };
              }
            }
          }
        }
        return null;
      },

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
        projects: s.projects,
        files: s.files,
        mainFile: s.mainFile,
        apiKeys: s.apiKeys,
        selectedModel: s.selectedModel,
      }),
      // Migration: if upgrading from old single-project format, wrap existing files into a project
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        if (state.projects.length === 0 && Object.keys(state.files).length > 0) {
          const now = Date.now();
          const migratedProject: Project = {
            id: generateId(),
            name: "My Project",
            files: state.files,
            mainFile: state.mainFile,
            createdAt: now,
            updatedAt: now,
          };
          state.projects = [migratedProject];
        }
      },
    }
  )
);
