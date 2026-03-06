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

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
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
}
