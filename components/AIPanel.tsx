"use client";

import { useState, useRef, useEffect } from "react";
import { useEditorStore } from "@/lib/store";
import type { Message, AIModel, Attachment } from "@/types";
import { PlanPanel } from "./PlanPanel";
import { TemplateBrowser } from "./TemplateBrowser";
import {
  Send,
  Trash2,
  ChevronDown,
  ChevronUp,
  Bot,
  User,
  Clipboard,
  ClipboardCheck,
  Paperclip,
  X,
  FileText,
  Brain,
  ListTodo,
  Layout,
  Lightbulb,
} from "lucide-react";

const MODEL_OPTIONS: { value: AIModel; label: string; supportsThinking: boolean }[] = [
  { value: "claude", label: "Claude Opus (Anthropic)", supportsThinking: true },
  { value: "gpt-4", label: "GPT-4o (OpenAI)", supportsThinking: false },
];

function ThinkingBlock({ thinking }: { thinking: string }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!thinking) return null;

  return (
    <div className="mb-2 border border-[#2a2a2a] rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 px-3 py-2 bg-[#111] hover:bg-[#1a1a1a] transition-colors text-left"
      >
        <Lightbulb size={12} className="text-purple-400" />
        <span className="text-xs text-purple-400 font-medium">Thinking</span>
        <span className="text-[10px] text-[#666] ml-auto">
          {thinking.length} chars
        </span>
        {isExpanded ? (
          <ChevronUp size={12} className="text-[#666]" />
        ) : (
          <ChevronDown size={12} className="text-[#666]" />
        )}
      </button>
      {isExpanded && (
        <div className="px-3 py-2 bg-[#0a0a0a] border-t border-[#2a2a2a] max-h-48 overflow-y-auto">
          <p className="text-xs text-[#888] whitespace-pre-wrap leading-relaxed">
            {thinking}
          </p>
        </div>
      )}
    </div>
  );
}

function MarkdownMessage({ content, thinking }: { content: string; thinking?: string }) {
  const [copiedBlock, setCopiedBlock] = useState<number | null>(null);

  const parts: Array<{ type: "text" | "code"; content: string; lang?: string }> = [];
  const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", content: content.slice(lastIndex, match.index) });
    }
    parts.push({ type: "code", lang: match[1], content: match[2] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push({ type: "text", content: content.slice(lastIndex) });
  }

  function copyCode(code: string, idx: number) {
    navigator.clipboard.writeText(code);
    setCopiedBlock(idx);
    setTimeout(() => setCopiedBlock(null), 2000);
  }

  function applyToEditor(code: string) {
    window.dispatchEvent(new CustomEvent("apply-to-editor", { detail: { code } }));
  }

  return (
    <div className="space-y-2">
      {thinking && <ThinkingBlock thinking={thinking} />}
      {parts.map((part, i) =>
        part.type === "text" ? (
          <p key={i} className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {part.content}
          </p>
        ) : (
          <div key={i} className="relative group rounded-lg overflow-hidden border border-[#2a2a2a]">
            <div className="flex items-center justify-between bg-[#111] px-3 py-1.5 border-b border-[#2a2a2a]">
              <span className="text-xs text-[#666]">{part.lang || "code"}</span>
              <div className="flex items-center gap-1">
                {(part.lang === "latex" || part.lang === "tex") && (
                  <button
                    onClick={() => applyToEditor(part.content)}
                    className="text-xs text-[#fbbf24] hover:text-[#f59e0b] px-2 py-0.5 rounded-lg hover:bg-[#fbbf24]/10 transition-colors"
                  >
                    Apply
                  </button>
                )}
                <button
                  onClick={() => copyCode(part.content, i)}
                  className="p-1 rounded-lg hover:bg-[#2a2a2a] text-[#666] hover:text-white transition-colors"
                >
                  {copiedBlock === i ? (
                    <ClipboardCheck size={12} className="text-[#fbbf24]" />
                  ) : (
                    <Clipboard size={12} />
                  )}
                </button>
              </div>
            </div>
            <pre className="text-xs text-[#999] font-mono p-3 overflow-x-auto bg-[#0a0a0a] leading-relaxed">
              {part.content.trim()}
            </pre>
          </div>
        )
      )}
    </div>
  );
}

export function AIPanel() {
  const {
    aiMessages,
    selectedModel,
    apiKeys,
    isAiLoading,
    activeFile,
    files,
    compileLogs,
    compileErrors,
    addAiMessage,
    updateLastAiMessage,
    clearAiMessages,
    setSelectedModel,
    setApiKeys,
    setIsAiLoading,
    enableThinking,
    setEnableThinking,
    thinkingBudget,
    pendingAttachments,
    addPendingAttachment,
    removePendingAttachment,
    clearPendingAttachments,
    planMode,
    setPlanMode,
  } = useEditorStore();

  const [input, setInput] = useState("");
  const [showModelSelect, setShowModelSelect] = useState(false);
  const [includeContext, setIncludeContext] = useState(true);
  const [showTemplates, setShowTemplates] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentModelSupportsThinking = MODEL_OPTIONS.find(
    (m) => m.value === selectedModel
  )?.supportsThinking;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiMessages]);

  // Handle "apply to editor" events from messages
  useEffect(() => {
    function handleApply(e: CustomEvent<{ code: string }>) {
      window.dispatchEvent(
        new CustomEvent("insert-latex-snippet", { detail: { code: e.detail.code } })
      );
    }
    window.addEventListener("apply-to-editor", handleApply as EventListener);
    return () => window.removeEventListener("apply-to-editor", handleApply as EventListener);
  }, []);

  const activeApiKey =
    selectedModel === "claude" ? apiKeys.anthropic : apiKeys.openai;

  async function handleFileUpload(fileList: FileList | null) {
    if (!fileList) return;

    for (const file of Array.from(fileList)) {
      const validTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
        "text/markdown",
        "application/x-tex",
      ];
      const validExtensions = [".pdf", ".docx", ".txt", ".md", ".tex"];
      const ext = "." + file.name.split(".").pop()?.toLowerCase();

      if (!validTypes.includes(file.type) && !validExtensions.includes(ext)) {
        alert(`Unsupported file type: ${file.name}`);
        continue;
      }

      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/extract", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json();
          alert(`Failed to process ${file.name}: ${err.error}`);
          continue;
        }

        const data = await res.json();
        const attachment: Attachment = {
          id: crypto.randomUUID(),
          name: file.name,
          type: file.type || ext,
          size: file.size,
          extractedText: data.text,
        };
        addPendingAttachment(attachment);
      } catch (err) {
        console.error("Upload error:", err);
        alert(`Failed to upload ${file.name}`);
      }
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || isAiLoading) return;

    if (!activeApiKey) {
      alert(
        `Please add your ${selectedModel === "claude" ? "Anthropic" : "OpenAI"} API key in Settings.`
      );
      return;
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: Date.now(),
      attachments: pendingAttachments.length > 0 ? [...pendingAttachments] : undefined,
    };
    addAiMessage(userMessage);
    setInput("");
    clearPendingAttachments();
    setIsAiLoading(true);

    // Build context with file content and attachments
    let context = "";
    if (includeContext && activeFile && files[activeFile]) {
      context = `File: ${activeFile}\n\`\`\`latex\n${files[activeFile]}\n\`\`\``;
      if (compileErrors.length > 0) {
        context += `\n\nCompile errors:\n${compileErrors.join("\n")}`;
      }
    }

    // Add attachment content to context
    if (userMessage.attachments && userMessage.attachments.length > 0) {
      for (const att of userMessage.attachments) {
        if (att.extractedText) {
          context += `\n\n<uploaded_file name="${att.name}">\n${att.extractedText}\n</uploaded_file>`;
        }
      }
    }

    // Placeholder assistant message
    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
      timestamp: Date.now(),
    };
    addAiMessage(assistantMessage);

    try {
      const apiMessages = aiMessages
        .concat(userMessage)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: apiMessages,
          context,
          model: selectedModel,
          apiKey: activeApiKey,
          enableThinking: enableThinking && currentModelSupportsThinking,
          thinkingBudget,
          planMode,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        updateLastAiMessage(`Error: ${err.error ?? "Unknown error"}`);
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let fullText = "";
      let fullThinking = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.thinking) {
                fullThinking += data.thinking;
                updateLastAiMessage(fullText, fullThinking);
              }
              if (data.text) {
                fullText += data.text;
                updateLastAiMessage(fullText, fullThinking || undefined);
              }
              if (data.error) {
                updateLastAiMessage(`Error: ${data.error}`);
              }
            } catch {
              // skip malformed chunks
            }
          }
        }
      }
    } catch (err: unknown) {
      const error = err as Error;
      updateLastAiMessage(`Error: ${error.message}`);
    } finally {
      setIsAiLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function handleFixErrors() {
    if (compileErrors.length === 0) return;
    setInput(
      `Please fix these LaTeX compile errors:\n${compileErrors.join("\n")}`
    );
    textareaRef.current?.focus();
  }

  return (
    <div 
      className={`relative flex flex-col h-full bg-[#0a0a0a] ${isDragging ? 'ring-2 ring-[#fbbf24] ring-inset' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.docx,.txt,.md,.tex"
        className="hidden"
        onChange={(e) => handleFileUpload(e.target.files)}
      />

      {/* Template Browser Modal */}
      <TemplateBrowser isOpen={showTemplates} onClose={() => setShowTemplates(false)} />

      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#1a1a1a] bg-[#0a0a0a] shrink-0">
        <div className="flex items-center gap-2">
          <Bot size={14} className="text-[#fbbf24]" />
          <span className="text-xs font-semibold text-white">
            AI Assistant
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowTemplates(true)}
            className="p-1.5 rounded-lg hover:bg-[#2a2a2a] text-[#666] hover:text-white transition-colors"
            title="Browse templates"
          >
            <Layout size={13} />
          </button>
          <button
            onClick={() => setPlanMode(!planMode)}
            className={`p-1.5 rounded-lg transition-colors ${
              planMode 
                ? 'bg-[#fbbf24]/20 text-[#fbbf24]' 
                : 'hover:bg-[#2a2a2a] text-[#666] hover:text-white'
            }`}
            title={planMode ? "Exit plan mode" : "Enter plan mode"}
          >
            <ListTodo size={13} />
          </button>
          {compileErrors.length > 0 && (
            <button
              onClick={handleFixErrors}
              className="text-xs text-[#fbbf24] hover:text-[#f59e0b] px-2 py-1 rounded-lg hover:bg-[#fbbf24]/10 transition-colors"
              title="Ask AI to fix compile errors"
            >
              Fix errors
            </button>
          )}
          <button
            onClick={clearAiMessages}
            className="p-1.5 rounded-lg hover:bg-[#2a2a2a] text-[#666] hover:text-white transition-colors"
            title="Clear chat"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Model selector */}
      <div className="px-3 py-2 border-b border-[#1a1a1a] shrink-0">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <button
              onClick={() => setShowModelSelect(!showModelSelect)}
              className="w-full flex items-center justify-between px-3 py-2 bg-[#1a1a1a] hover:bg-[#2a2a2a] rounded-lg text-xs text-white transition-colors"
            >
              <span>
                {MODEL_OPTIONS.find((m) => m.value === selectedModel)?.label}
              </span>
              <ChevronDown size={12} className="text-[#666]" />
            </button>

            {showModelSelect && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#111] border border-[#2a2a2a] rounded-lg shadow-lg z-10 overflow-hidden">
                {MODEL_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setSelectedModel(opt.value);
                      setShowModelSelect(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 text-xs transition-colors ${
                      selectedModel === opt.value
                        ? "text-[#fbbf24] bg-[#fbbf24]/10"
                        : "text-white hover:bg-[#1a1a1a]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{opt.label}</span>
                      {opt.supportsThinking && (
                        <Brain size={10} className="text-purple-400" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Thinking mode toggle */}
          {currentModelSupportsThinking && (
            <button
              onClick={() => setEnableThinking(!enableThinking)}
              className={`px-3 py-2 rounded-lg text-xs transition-colors flex items-center gap-1.5 ${
                enableThinking
                  ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                  : "bg-[#1a1a1a] text-[#666] hover:text-white hover:bg-[#2a2a2a]"
              }`}
              title={enableThinking ? "Thinking enabled" : "Enable extended thinking"}
            >
              <Brain size={12} />
              <span className="hidden sm:inline">Think</span>
            </button>
          )}
        </div>

        {/* API key status */}
        {!activeApiKey && (
          <p className="text-xs text-[#fbbf24]/80 mt-1.5">
            ⚠ No API key — add one in Settings
          </p>
        )}
        
        {/* Thinking mode indicator */}
        {enableThinking && currentModelSupportsThinking && (
          <p className="text-xs text-purple-400/80 mt-1.5 flex items-center gap-1">
            <Lightbulb size={10} />
            Extended thinking enabled
          </p>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 min-h-0">
        {aiMessages.length === 0 ? (
          <div className="text-center py-8 space-y-3">
            <Bot size={28} className="mx-auto text-[#fbbf24] opacity-50" />
            <div className="text-xs text-[#666] space-y-1">
              <p className="text-[#999]">How can I help with your LaTeX document?</p>
              <p className="opacity-60">Try asking me to:</p>
              <div className="space-y-1 mt-2">
                {[
                  "Fix compile errors",
                  "Add a bibliography section",
                  "Create a table",
                  "Explain an equation",
                ].map((s) => (
                  <button
                    key={s}
                    onClick={() => setInput(s)}
                    className="block w-full text-left px-2 py-1.5 rounded-lg text-xs text-[#666] hover:text-white hover:bg-[#1a1a1a] transition-colors"
                  >
                    → {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          aiMessages.map((msg) => (
            <div key={msg.id} className="space-y-1">
              <div className="flex items-center gap-1.5">
                {msg.role === "user" ? (
                  <User size={11} className="text-[#666]" />
                ) : (
                  <Bot size={11} className="text-[#fbbf24]" />
                )}
                <span className="text-[10px] text-[#666] capitalize">
                  {msg.role === "user" ? "You" : "Assistant"}
                </span>
              </div>
              
              {/* Show attachments for user messages */}
              {msg.role === "user" && msg.attachments && msg.attachments.length > 0 && (
                <div className="flex flex-wrap gap-1 ml-2">
                  {msg.attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center gap-1 px-2 py-1 bg-[#1a1a1a] rounded text-[10px] text-[#999]"
                    >
                      <FileText size={10} />
                      <span className="max-w-24 truncate">{att.name}</span>
                    </div>
                  ))}
                </div>
              )}
              
              <div
                className={`rounded-lg px-3 py-2 text-white ${
                  msg.role === "user"
                    ? "bg-[#fbbf24]/20 ml-2"
                    : "bg-[#1a1a1a]"
                }`}
              >
                {msg.role === "assistant" ? (
                  <MarkdownMessage content={msg.content} thinking={msg.thinking} />
                ) : (
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {msg.content}
                  </p>
                )}
                {msg.role === "assistant" && isAiLoading && msg.content === "" && !msg.thinking && (
                  <div className="flex gap-1 py-1">
                    <span className="w-1.5 h-1.5 bg-[#fbbf24] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-[#fbbf24] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-[#fbbf24] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                )}
                {msg.role === "assistant" && isAiLoading && msg.thinking && msg.content === "" && (
                  <div className="flex items-center gap-2 py-1 text-purple-400">
                    <Brain size={12} className="animate-pulse" />
                    <span className="text-xs">Thinking...</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Plan Panel */}
      {planMode && <PlanPanel />}

      {/* Context toggle */}
      <div className="px-3 py-2 border-t border-[#1a1a1a] flex items-center gap-3 shrink-0">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={includeContext}
            onChange={(e) => setIncludeContext(e.target.checked)}
            className="w-3 h-3 accent-[#fbbf24]"
          />
          <span className="text-xs text-[#666]">Include current file</span>
        </label>
      </div>

      {/* Pending attachments */}
      {pendingAttachments.length > 0 && (
        <div className="px-3 py-2 border-t border-[#1a1a1a] shrink-0">
          <div className="flex flex-wrap gap-1.5">
            {pendingAttachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center gap-1.5 px-2 py-1 bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] group"
              >
                <FileText size={12} className="text-[#fbbf24]" />
                <span className="text-xs text-white max-w-32 truncate">
                  {att.name}
                </span>
                <span className="text-[10px] text-[#666]">
                  ({Math.round(att.size / 1024)}KB)
                </span>
                <button
                  onClick={() => removePendingAttachment(att.id)}
                  className="p-0.5 text-[#666] hover:text-red-400 transition-colors"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-[#fbbf24]/10 backdrop-blur-sm flex items-center justify-center z-10 pointer-events-none">
          <div className="text-center">
            <Paperclip size={32} className="mx-auto text-[#fbbf24] mb-2" />
            <p className="text-sm text-white">Drop files here</p>
            <p className="text-xs text-[#666]">PDF, DOCX, TXT, MD, TEX</p>
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="px-3 pb-3 shrink-0">
        <div className="flex gap-2 bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] focus-within:border-[#fbbf24] transition-colors">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="self-end mb-2 ml-2 p-2 text-[#666] hover:text-[#fbbf24] transition-colors"
            title="Attach files"
          >
            <Paperclip size={14} />
          </button>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={planMode ? "Describe what you want to plan…" : "Ask about LaTeX… (Enter to send)"}
            rows={2}
            className="flex-1 bg-transparent text-white text-xs py-2.5 resize-none outline-none placeholder-[#444] leading-relaxed"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isAiLoading}
            className="px-2 self-end mb-2 mr-1.5 p-2 bg-[#fbbf24] hover:bg-[#f59e0b] disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            <Send size={12} className="text-black" />
          </button>
        </div>
      </div>
    </div>
  );
}
