"use client";

import { useState, useRef, useEffect } from "react";
import { useEditorStore } from "@/lib/store";
import type { Project } from "@/types";
import {
  Plus,
  FileText,
  Trash2,
  Pencil,
  Check,
  X,
  Clock,
  FolderOpen,
} from "lucide-react";

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function codePreview(project: Project): string {
  const content = project.files[project.mainFile] ?? Object.values(project.files)[0] ?? "";
  return content
    .split("\n")
    .filter((l) => l.trim().length > 0)
    .slice(0, 5)
    .join("\n");
}

interface ProjectCardProps {
  project: Project;
  onOpen: () => void;
  onDelete: () => void;
  onRename: (name: string) => void;
}

function ProjectCard({ project, onOpen, onDelete, onRename }: ProjectCardProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(project.name);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isRenaming) renameInputRef.current?.select();
  }, [isRenaming]);

  function commitRename() {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== project.name) onRename(trimmed);
    setIsRenaming(false);
  }

  function handleRenameKey(e: React.KeyboardEvent) {
    if (e.key === "Enter") commitRename();
    if (e.key === "Escape") {
      setRenameValue(project.name);
      setIsRenaming(false);
    }
  }

  const fileCount = Object.keys(project.files).length;
  const preview = codePreview(project);

  return (
    <div
      className="group relative flex flex-col bg-[#111] border border-[#1e1e1e] hover:border-[#333] rounded-xl overflow-hidden cursor-pointer transition-all duration-150 hover:shadow-lg hover:shadow-black/40"
      onClick={() => !isRenaming && !confirmDelete && onOpen()}
    >
      {/* Code preview area */}
      <div className="h-32 bg-[#0a0a0a] border-b border-[#1a1a1a] p-3 overflow-hidden select-none">
        <pre className="text-[10px] leading-[1.6] text-[#555] font-mono whitespace-pre-wrap line-clamp-5 pointer-events-none">
          {preview || "\\documentclass{article}"}
        </pre>
      </div>

      {/* Card body */}
      <div className="flex flex-col gap-2 p-3.5">
        {/* Project name */}
        {isRenaming ? (
          <div
            className="flex items-center gap-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              ref={renameInputRef}
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={handleRenameKey}
              className="flex-1 bg-[#1a1a1a] border border-[#fbbf24] rounded-md px-2 py-1 text-sm text-white outline-none min-w-0"
            />
            <button
              onClick={commitRename}
              className="p-1 text-[#fbbf24] hover:text-white transition-colors shrink-0"
            >
              <Check size={13} />
            </button>
            <button
              onClick={() => {
                setRenameValue(project.name);
                setIsRenaming(false);
              }}
              className="p-1 text-[#666] hover:text-white transition-colors shrink-0"
            >
              <X size={13} />
            </button>
          </div>
        ) : (
          <p className="text-sm font-semibold text-white truncate">{project.name}</p>
        )}

        {/* Meta */}
        <div className="flex items-center gap-3 text-[11px] text-[#555]">
          <span className="flex items-center gap-1">
            <FileText size={10} />
            {fileCount} {fileCount === 1 ? "file" : "files"}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={10} />
            {relativeTime(project.updatedAt)}
          </span>
        </div>
      </div>

      {/* Action buttons — visible on hover */}
      {!isRenaming && (
        <div
          className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setIsRenaming(true)}
            className="p-1.5 rounded-lg bg-[#1a1a1a] text-[#666] hover:text-white hover:bg-[#2a2a2a] transition-colors"
            title="Rename"
          >
            <Pencil size={11} />
          </button>
          {confirmDelete ? (
            <>
              <button
                onClick={onDelete}
                className="px-2 py-1 rounded-lg bg-red-600/80 text-white text-[10px] font-semibold hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="p-1.5 rounded-lg bg-[#1a1a1a] text-[#666] hover:text-white hover:bg-[#2a2a2a] transition-colors"
              >
                <X size={11} />
              </button>
            </>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="p-1.5 rounded-lg bg-[#1a1a1a] text-[#666] hover:text-red-400 hover:bg-[#2a2a2a] transition-colors"
              title="Delete"
            >
              <Trash2 size={11} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

interface NewProjectCardProps {
  onCreate: (name: string) => void;
}

function NewProjectCard({ onCreate }: NewProjectCardProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCreating) inputRef.current?.focus();
  }, [isCreating]);

  function commit() {
    const trimmed = name.trim();
    if (trimmed) onCreate(trimmed);
    setName("");
    setIsCreating(false);
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter") commit();
    if (e.key === "Escape") {
      setName("");
      setIsCreating(false);
    }
  }

  return (
    <div
      className={`flex flex-col items-center justify-center bg-[#0d0d0d] border ${
        isCreating ? "border-[#fbbf24]/50" : "border-dashed border-[#2a2a2a] hover:border-[#444]"
      } rounded-xl min-h-[180px] cursor-pointer transition-all duration-150 group`}
      onClick={() => !isCreating && setIsCreating(true)}
    >
      {isCreating ? (
        <div
          className="flex flex-col items-center gap-3 px-4 w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-xs text-[#888] font-medium">New project name</p>
          <input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Untitled Project"
            className="w-full bg-[#1a1a1a] border border-[#333] focus:border-[#fbbf24] rounded-lg px-3 py-2 text-sm text-white outline-none placeholder-[#444] text-center transition-colors"
          />
          <div className="flex gap-2">
            <button
              onClick={commit}
              disabled={!name.trim()}
              className="px-4 py-1.5 bg-[#fbbf24] hover:bg-[#f59e0b] disabled:opacity-40 disabled:cursor-not-allowed text-black text-xs font-semibold rounded-lg transition-colors"
            >
              Create
            </button>
            <button
              onClick={() => {
                setName("");
                setIsCreating(false);
              }}
              className="px-3 py-1.5 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-[#666] hover:text-white text-xs rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 text-[#444] group-hover:text-[#666] transition-colors">
          <div className="w-10 h-10 rounded-xl border-2 border-dashed border-current flex items-center justify-center">
            <Plus size={18} />
          </div>
          <span className="text-xs font-medium">New Project</span>
        </div>
      )}
    </div>
  );
}

export function Dashboard() {
  const { projects, createProject, openProject, deleteProject, renameProject } =
    useEditorStore();

  const sorted = [...projects].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-black">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 bg-[#0a0a0a] border-b border-[#1a1a1a] shrink-0 h-[48px]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-[#fbbf24] rounded-lg flex items-center justify-center">
            <span className="text-[10px] font-bold text-black">Lx</span>
          </div>
          <span className="text-sm font-semibold text-white">LaTeX AI</span>
        </div>
        <span className="text-xs text-[#555]">
          {projects.length} {projects.length === 1 ? "project" : "projects"}
        </span>
      </header>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-10">
          {/* Page title */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white tracking-tight">Projects</h1>
            <p className="text-sm text-[#555] mt-1">
              Pick up where you left off, or start something new.
            </p>
          </div>

          {sorted.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#111] border border-[#1e1e1e] flex items-center justify-center">
                <FolderOpen size={28} className="text-[#333]" />
              </div>
              <div>
                <p className="text-base font-semibold text-[#888]">No projects yet</p>
                <p className="text-sm text-[#555] mt-1">
                  Create your first project to get started.
                </p>
              </div>
              <button
                onClick={() => createProject("My First Project")}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#fbbf24] hover:bg-[#f59e0b] text-black text-sm font-semibold rounded-xl transition-colors"
              >
                <Plus size={15} />
                Create Project
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {/* New project card always first */}
              <NewProjectCard onCreate={createProject} />

              {sorted.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onOpen={() => openProject(project.id)}
                  onDelete={() => deleteProject(project.id)}
                  onRename={(name) => renameProject(project.id, name)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
