"use client";

import { useState, useRef, useEffect } from "react";
import { useEditorStore } from "@/lib/store";
import type { Message, AIModel } from "@/types";
import {
  Send,
  Trash2,
  ChevronDown,
  Bot,
  User,
  Clipboard,
  ClipboardCheck,
} from "lucide-react";

const MODEL_OPTIONS: { value: AIModel; label: string }[] = [
  { value: "claude", label: "Claude (Anthropic)" },
  { value: "gpt-4", label: "GPT-4o (OpenAI)" },
];

function MarkdownMessage({ content }: { content: string }) {
  const [copiedBlock, setCopiedBlock] = useState<number | null>(null);

  // Parse content into text and code blocks
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
      {parts.map((part, i) =>
        part.type === "text" ? (
          <p key={i} className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {part.content}
          </p>
        ) : (
          <div key={i} className="relative group rounded overflow-hidden border border-[#3d3d3d]">
            <div className="flex items-center justify-between bg-[#1e1e1e] px-3 py-1 border-b border-[#3d3d3d]">
              <span className="text-xs text-[#858585]">{part.lang || "code"}</span>
              <div className="flex items-center gap-1">
                {(part.lang === "latex" || part.lang === "tex") && (
                  <button
                    onClick={() => applyToEditor(part.content)}
                    className="text-xs text-[#007acc] hover:text-blue-300 px-2 py-0.5 rounded hover:bg-[#007acc20] transition-colors"
                  >
                    Apply
                  </button>
                )}
                <button
                  onClick={() => copyCode(part.content, i)}
                  className="p-1 rounded hover:bg-[#3d3d3d] text-[#858585] hover:text-[#cccccc] transition-colors"
                >
                  {copiedBlock === i ? (
                    <ClipboardCheck size={12} className="text-green-400" />
                  ) : (
                    <Clipboard size={12} />
                  )}
                </button>
              </div>
            </div>
            <pre className="text-xs text-[#ce9178] font-mono p-3 overflow-x-auto bg-[#1a1a1a] leading-relaxed">
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
  } = useEditorStore();

  const [input, setInput] = useState("");
  const [showModelSelect, setShowModelSelect] = useState(false);
  const [includeContext, setIncludeContext] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    };
    addAiMessage(userMessage);
    setInput("");
    setIsAiLoading(true);

    // Build context
    let context = "";
    if (includeContext && activeFile && files[activeFile]) {
      context = `File: ${activeFile}\n\`\`\`latex\n${files[activeFile]}\n\`\`\``;
      if (compileErrors.length > 0) {
        context += `\n\nCompile errors:\n${compileErrors.join("\n")}`;
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

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.text) {
                fullText += data.text;
                updateLastAiMessage(fullText);
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
    <div className="flex flex-col h-full bg-[#1e1e1e]">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#2d2d2d] bg-[#252526] shrink-0">
        <div className="flex items-center gap-2">
          <Bot size={14} className="text-[#007acc]" />
          <span className="text-xs font-semibold text-[#cccccc]">
            AI Assistant
          </span>
        </div>
        <div className="flex items-center gap-1">
          {compileErrors.length > 0 && (
            <button
              onClick={handleFixErrors}
              className="text-xs text-red-400 hover:text-red-300 px-2 py-0.5 rounded hover:bg-red-900/20 transition-colors"
              title="Ask AI to fix compile errors"
            >
              Fix errors
            </button>
          )}
          <button
            onClick={clearAiMessages}
            className="p-1 rounded hover:bg-[#2d2d2d] text-[#858585] hover:text-[#cccccc] transition-colors"
            title="Clear chat"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Model selector */}
      <div className="px-3 py-2 border-b border-[#2d2d2d] shrink-0">
        <div className="relative">
          <button
            onClick={() => setShowModelSelect(!showModelSelect)}
            className="w-full flex items-center justify-between px-2 py-1.5 bg-[#2d2d2d] hover:bg-[#3d3d3d] rounded text-xs text-[#cccccc] transition-colors"
          >
            <span>
              {MODEL_OPTIONS.find((m) => m.value === selectedModel)?.label}
            </span>
            <ChevronDown size={12} />
          </button>

          {showModelSelect && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#252526] border border-[#454545] rounded shadow-lg z-10">
              {MODEL_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setSelectedModel(opt.value);
                    setShowModelSelect(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                    selectedModel === opt.value
                      ? "text-[#007acc] bg-[#094771]"
                      : "text-[#cccccc] hover:bg-[#2a2d2e]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* API key status */}
        {!activeApiKey && (
          <p className="text-xs text-yellow-500/80 mt-1.5">
            ⚠ No API key — add one in Settings
          </p>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 min-h-0">
        {aiMessages.length === 0 ? (
          <div className="text-center py-8 space-y-3">
            <Bot size={28} className="mx-auto text-[#007acc] opacity-50" />
            <div className="text-xs text-[#858585] space-y-1">
              <p>How can I help with your LaTeX document?</p>
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
                    className="block w-full text-left px-2 py-1 rounded text-xs text-[#858585] hover:text-[#cccccc] hover:bg-[#2d2d2d] transition-colors"
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
                  <User size={11} className="text-[#858585]" />
                ) : (
                  <Bot size={11} className="text-[#007acc]" />
                )}
                <span className="text-[10px] text-[#858585] capitalize">
                  {msg.role === "user" ? "You" : "Assistant"}
                </span>
              </div>
              <div
                className={`rounded px-3 py-2 text-[#cccccc] ${
                  msg.role === "user"
                    ? "bg-[#094771] ml-2"
                    : "bg-[#2d2d2d]"
                }`}
              >
                {msg.role === "assistant" ? (
                  <MarkdownMessage content={msg.content} />
                ) : (
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {msg.content}
                  </p>
                )}
                {msg.role === "assistant" && isAiLoading && msg.content === "" && (
                  <div className="flex gap-1 py-1">
                    <span className="w-1.5 h-1.5 bg-[#007acc] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-[#007acc] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-[#007acc] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Context toggle */}
      <div className="px-3 py-1.5 border-t border-[#2d2d2d] flex items-center gap-2 shrink-0">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={includeContext}
            onChange={(e) => setIncludeContext(e.target.checked)}
            className="w-3 h-3 accent-[#007acc]"
          />
          <span className="text-xs text-[#858585]">Include current file</span>
        </label>
      </div>

      {/* Input area */}
      <div className="px-3 pb-3 shrink-0">
        <div className="flex gap-2 bg-[#2d2d2d] rounded border border-[#3d3d3d] focus-within:border-[#007acc] transition-colors">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about LaTeX… (Enter to send, Shift+Enter for newline)"
            rows={2}
            className="flex-1 bg-transparent text-[#cccccc] text-xs px-3 py-2 resize-none outline-none placeholder-[#555] leading-relaxed"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isAiLoading}
            className="px-2 self-end mb-1.5 mr-1 p-1.5 bg-[#007acc] hover:bg-[#1a8ad4] disabled:opacity-40 disabled:cursor-not-allowed rounded transition-colors"
          >
            <Send size={12} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
