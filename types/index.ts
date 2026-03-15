export interface FileEntry {
  name: string;
  content: string;
}

export interface Project {
  id: string;
  name: string;
  files: FileMap;
  mainFile: string;
  createdAt: number;
  updatedAt: number;
}

export type FileMap = Record<string, string>;

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  extractedText?: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  attachments?: Attachment[];
  thinking?: string;
}

export type AIModel = "claude" | "gpt-4";

export interface ApiKeys {
  anthropic?: string;
  openai?: string;
}

export interface CompileResult {
  pdf: string | null;
  logs: string;
  errors: string[];
  success: boolean;
}

export interface ChatRequest {
  messages: Message[];
  context: string;
  model: AIModel;
  apiKey: string;
  enableThinking?: boolean;
  thinkingBudget?: number;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: "academic" | "report" | "presentation" | "letter" | "custom";
  content: string;
  packages?: string[];
  preview?: string;
}

export interface PlanItem {
  id: string;
  text: string;
  completed: boolean;
  children?: PlanItem[];
}

export interface Plan {
  id: string;
  title: string;
  items: PlanItem[];
  createdAt: number;
  updatedAt: number;
}
