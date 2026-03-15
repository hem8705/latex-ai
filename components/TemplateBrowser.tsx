"use client";

import { useState } from "react";
import { TEMPLATES, getTemplatesByCategory } from "@/lib/templates";
import type { Template } from "@/types";
import { useEditorStore } from "@/lib/store";
import {
  X,
  FileText,
  GraduationCap,
  FileBarChart,
  Presentation,
  Mail,
  Sparkles,
  Check,
  Eye,
} from "lucide-react";

const CATEGORIES = [
  { id: "all", label: "All", icon: Sparkles },
  { id: "academic", label: "Academic", icon: GraduationCap },
  { id: "report", label: "Reports", icon: FileBarChart },
  { id: "presentation", label: "Presentations", icon: Presentation },
  { id: "letter", label: "Letters", icon: Mail },
  { id: "custom", label: "Custom", icon: FileText },
] as const;

interface TemplateBrowserProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TemplateBrowser({ isOpen, onClose }: TemplateBrowserProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const { setFileContent, activeFile, addFile } = useEditorStore();

  if (!isOpen) return null;

  const filteredTemplates =
    selectedCategory === "all"
      ? TEMPLATES
      : getTemplatesByCategory(selectedCategory as Template["category"]);

  function applyTemplate(template: Template) {
    if (activeFile) {
      setFileContent(activeFile, template.content);
    } else {
      addFile("main.tex", template.content);
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#111] border border-[#2a2a2a] rounded-xl w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a2a]">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <FileText size={18} className="text-[#fbbf24]" />
            Template Library
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#2a2a2a] text-[#666] hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Sidebar */}
          <div className="w-48 border-r border-[#2a2a2a] p-3 flex flex-col gap-1">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedCategory === cat.id
                      ? "bg-[#fbbf24]/20 text-[#fbbf24]"
                      : "text-[#999] hover:text-white hover:bg-[#1a1a1a]"
                  }`}
                >
                  <Icon size={14} />
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Templates Grid */}
          <div className="flex-1 p-4 overflow-y-auto">
            {previewTemplate ? (
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-medium">
                    {previewTemplate.name}
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPreviewTemplate(null)}
                      className="px-3 py-1.5 text-xs text-[#999] hover:text-white transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => applyTemplate(previewTemplate)}
                      className="px-3 py-1.5 text-xs bg-[#fbbf24] text-black rounded-lg hover:bg-[#f59e0b] transition-colors flex items-center gap-1"
                    >
                      <Check size={12} />
                      Use Template
                    </button>
                  </div>
                </div>
                <pre className="flex-1 bg-[#0a0a0a] rounded-lg p-4 text-xs text-[#999] font-mono overflow-auto border border-[#2a2a2a]">
                  {previewTemplate.content}
                </pre>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {filteredTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4 hover:border-[#fbbf24]/50 transition-colors group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-white text-sm font-medium">
                        {template.name}
                      </h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#2a2a2a] text-[#666] capitalize">
                        {template.category}
                      </span>
                    </div>
                    <p className="text-xs text-[#666] mb-3">
                      {template.description}
                    </p>
                    {template.packages && template.packages.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {template.packages.slice(0, 4).map((pkg) => (
                          <span
                            key={pkg}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-[#0a0a0a] text-[#666]"
                          >
                            {pkg}
                          </span>
                        ))}
                        {template.packages.length > 4 && (
                          <span className="text-[10px] text-[#666]">
                            +{template.packages.length - 4}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setPreviewTemplate(template)}
                        className="flex-1 px-2 py-1.5 text-xs text-[#999] hover:text-white bg-[#0a0a0a] rounded-lg transition-colors flex items-center justify-center gap-1"
                      >
                        <Eye size={12} />
                        Preview
                      </button>
                      <button
                        onClick={() => applyTemplate(template)}
                        className="flex-1 px-2 py-1.5 text-xs text-black bg-[#fbbf24] hover:bg-[#f59e0b] rounded-lg transition-colors flex items-center justify-center gap-1"
                      >
                        <Check size={12} />
                        Use
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer with import option */}
        <div className="border-t border-[#2a2a2a] px-4 py-3 flex items-center justify-between">
          <p className="text-xs text-[#666]">
            {filteredTemplates.length} template{filteredTemplates.length !== 1 ? "s" : ""} available
          </p>
          <label className="px-3 py-1.5 text-xs text-[#999] hover:text-white bg-[#1a1a1a] rounded-lg transition-colors cursor-pointer flex items-center gap-1.5">
            <FileText size={12} />
            Import Custom Template
            <input
              type="file"
              accept=".tex,.txt"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const content = await file.text();
                  if (activeFile) {
                    setFileContent(activeFile, content);
                  } else {
                    addFile(file.name.replace(/\.[^.]+$/, ".tex"), content);
                  }
                  onClose();
                }
              }}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
