"use client";

import { useState, useRef, useEffect } from "react";
import { useEditorStore } from "@/lib/store";
import {
  FileText,
  FilePlus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Star,
} from "lucide-react";

function getFileColor(name: string): string {
  const ext = name.includes(".") ? "." + name.split(".").pop() : "";
  if (ext === ".tex") return "text-[#fbbf24]";
  return "text-[#666]";
}

export function FileNavigator() {
  const {
    files,
    activeFile,
    mainFile,
    openFile,
    addFile,
    deleteFile,
    setMainFile,
  } = useEditorStore();

  const [isExpanded, setIsExpanded] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [hoveredFile, setHoveredFile] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    file: string;
    x: number;
    y: number;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAdding) {
      inputRef.current?.focus();
    }
  }, [isAdding]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        contextMenuRef.current &&
        !contextMenuRef.current.contains(e.target as Node)
      ) {
        setContextMenu(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fileNames = Object.keys(files).sort((a, b) => {
    // Main file first, then alphabetical
    if (a === mainFile) return -1;
    if (b === mainFile) return 1;
    return a.localeCompare(b);
  });

  function handleAddFile() {
    const name = newFileName.trim();
    if (!name) {
      setIsAdding(false);
      setNewFileName("");
      return;
    }
    const finalName = name.includes(".") ? name : name + ".tex";
    addFile(finalName, "");
    setIsAdding(false);
    setNewFileName("");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleAddFile();
    if (e.key === "Escape") {
      setIsAdding(false);
      setNewFileName("");
    }
  }

  function handleContextMenu(e: React.MouseEvent, file: string) {
    e.preventDefault();
    setContextMenu({ file, x: e.clientX, y: e.clientY });
  }

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#1a1a1a]">
        <span className="text-xs font-semibold text-white uppercase tracking-wider">
          Files
        </span>
        <button
          onClick={() => setIsAdding(true)}
          className="p-1 rounded-lg hover:bg-[#2a2a2a] text-[#666] hover:text-white transition-colors"
          title="New file"
        >
          <FilePlus size={14} />
        </button>
      </div>

      {/* File tree */}
      <div className="flex-1 overflow-y-auto py-1">
        {/* Project folder */}
        <button
          className="w-full flex items-center gap-1 px-2 py-1.5 text-xs text-[#666] hover:text-white hover:bg-[#1a1a1a] transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <ChevronDown size={12} />
          ) : (
            <ChevronRight size={12} />
          )}
          <span className="font-medium">project</span>
        </button>

        {isExpanded && (
          <div className="pl-3">
            {fileNames.map((name) => (
              <div
                key={name}
                className={`group flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                  activeFile === name
                    ? "bg-[#1a1a1a] text-white"
                    : "text-[#888] hover:bg-[#1a1a1a] hover:text-white"
                }`}
                onClick={() => openFile(name)}
                onMouseEnter={() => setHoveredFile(name)}
                onMouseLeave={() => setHoveredFile(null)}
                onContextMenu={(e) => handleContextMenu(e, name)}
              >
                <FileText size={13} className={getFileColor(name)} />
                <span className="flex-1 truncate">{name}</span>

                {name === mainFile && (
                  <span title="Main file">
                    <Star
                      size={10}
                      className="text-[#fbbf24] fill-[#fbbf24] shrink-0"
                    />
                  </span>
                )}

                {hoveredFile === name && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteFile(name);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-[#333] hover:text-[#888] transition-all"
                    title="Delete file"
                  >
                    <Trash2 size={11} />
                  </button>
                )}
              </div>
            ))}

            {/* New file input */}
            {isAdding && (
              <div className="flex items-center gap-2 px-2 py-1">
                <FileText size={13} className="text-[#fbbf24]" />
                <input
                  ref={inputRef}
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={handleAddFile}
                  placeholder="filename.tex"
                  className="flex-1 bg-[#1a1a1a] text-white text-xs px-2 py-1 rounded-lg border border-[#fbbf24] outline-none min-w-0"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add file button at bottom */}
      <div className="border-t border-[#1a1a1a] p-2">
        <button
          onClick={() => setIsAdding(true)}
          className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-[#666] hover:text-white hover:bg-[#1a1a1a] rounded-lg transition-colors"
        >
          <FilePlus size={13} />
          <span>New file</span>
        </button>
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="fixed z-50 bg-[#111] border border-[#2a2a2a] rounded-lg shadow-lg py-1 min-w-[160px]"
        >
          <button
            className="w-full text-left px-3 py-2 text-xs text-white hover:bg-[#fbbf24]/20 transition-colors flex items-center gap-2"
            onClick={() => {
              setMainFile(contextMenu.file);
              setContextMenu(null);
            }}
          >
            <Star size={11} className="text-[#fbbf24]" />
            Set as main file
          </button>
          <div className="border-t border-[#2a2a2a] my-1" />
          <button
            className="w-full text-left px-3 py-2 text-xs text-[#888] hover:bg-[#2a2a2a] transition-colors flex items-center gap-2"
            onClick={() => {
              deleteFile(contextMenu.file);
              setContextMenu(null);
            }}
          >
            <Trash2 size={11} />
            Delete file
          </button>
        </div>
      )}
    </div>
  );
}
