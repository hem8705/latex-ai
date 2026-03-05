# LaTeX AI

A Cursor-style AI-powered LaTeX editor built with Next.js. Write LaTeX, compile to PDF with Tectonic, and get AI assistance from Claude or GPT-4o — all in one browser-based IDE.

![Layout: file navigator on the left, Monaco editor in the center, PDF preview next to it, AI chat panel on the right]

## Features

- **Monaco editor** with full LaTeX syntax highlighting, bracket matching, and snippets (`\begin`, `\frac`, `\section`, `\cite`, and more)
- **One-click compilation** via [Tectonic](https://tectonic-typesetting.github.io/) — a modern, self-contained LaTeX engine that automatically downloads any missing packages. Falls back to system `pdflatex` if needed
- **Live PDF preview** with zoom, page navigation, and one-click download
- **AI chat panel** powered by Anthropic (Claude) or OpenAI (GPT-4o) with streaming responses
  - Sends your current file as context automatically
  - "Apply" button inserts AI-suggested LaTeX directly into the editor
  - "Fix errors" shortcut pre-fills the chat with your latest compile errors
- **Multi-file projects** — add `.tex`, `.bib`, `.sty`, `.cls` files; right-click to set any file as the main entry point
- **Resizable panels** — drag the dividers between the file navigator, editor, PDF preview, and AI panel
- **Persistent state** — files, API keys, and settings are saved in `localStorage` across reloads

## Getting Started

### Prerequisites

- Node.js 18+
- An Anthropic API key ([console.anthropic.com](https://console.anthropic.com/)) and/or an OpenAI API key ([platform.openai.com](https://platform.openai.com/api-keys))

No LaTeX installation is required. Tectonic is bundled via the `node-latex-compiler` npm package and downloads packages on demand from CTAN.

### Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Add your API key

Click the **Settings** icon (⚙) in the top-right toolbar and paste your Anthropic or OpenAI API key. Keys are stored only in your browser's `localStorage` and are never sent to any server other than the respective AI provider.

## Usage

### Editing and compiling

| Action | How |
|---|---|
| Compile | Click **Compile** in the toolbar, or press `⌘↵` / `Ctrl↵` |
| Recompile | Click **Recompile** or use the same shortcut again |
| Toggle PDF preview | Click the **PDF** button in the toolbar |
| Download PDF | Click **Download** in the toolbar or the download icon in the PDF panel |
| Save | Auto-saved on every keystroke; `⌘S` also triggers a compile |

### File management

- Click **New file** at the bottom of the file navigator (or the `+` icon at the top) to create a new file. If you don't include an extension, `.tex` is added automatically.
- Right-click any file to set it as the **main file** (the entry point passed to Tectonic) or to delete it.
- Click a file name to open it. Tabs appear at the top of the editor for all open files.
- The main file is marked with a ★ in the file list and editor tabs.

### AI assistant

- Select the model (Claude or GPT-4o) from the dropdown at the top of the AI panel.
- Type your question and press **Enter** (or **Shift+Enter** for a newline). The current file is sent as context by default — uncheck "Include current file" to disable this.
- When the AI responds with a LaTeX code block, an **Apply** button appears above it to insert the code directly into the active editor file.
- If compilation fails, the **Fix errors** button pre-fills the input with the error messages so you can ask the AI to diagnose and fix them.
- Click the trash icon to clear the conversation history.

### Keyboard shortcuts

| Shortcut | Action |
|---|---|
| `⌘↵` / `Ctrl↵` | Compile |
| `⌘S` / `Ctrl+S` | Save & compile |
| `Enter` (in AI input) | Send message |
| `Shift+Enter` (in AI input) | New line in message |
| `Escape` (in new file input) | Cancel |

## Project structure

```
latex-ai/
├── app/
│   ├── api/
│   │   ├── compile/route.ts   # Tectonic compilation endpoint
│   │   └── chat/route.ts      # Streaming AI chat endpoint (Anthropic + OpenAI)
│   ├── page.tsx               # Main layout with resizable panels
│   ├── layout.tsx             # Root HTML layout
│   └── globals.css            # Tailwind + scrollbar styles
├── components/
│   ├── FileNavigator.tsx      # File tree with add/delete/set-main
│   ├── Editor.tsx             # Monaco editor with LaTeX language + tabs
│   ├── AIPanel.tsx            # Streaming chat UI with Apply/Fix-errors
│   ├── PDFPreview.tsx         # react-pdf viewer with zoom and logs panel
│   └── Toolbar.tsx            # Compile button, PDF toggle, Settings modal
├── lib/
│   ├── store.ts               # Zustand store (files, compile state, AI messages)
│   ├── latex.ts               # Tectonic/pdflatex compilation logic
│   └── monaco-latex.ts        # LaTeX Monarch tokenizer + completions
└── types/
    └── index.ts               # Shared TypeScript interfaces
```

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Editor | Monaco Editor (`@monaco-editor/react`) |
| PDF viewer | react-pdf (PDF.js) |
| LaTeX compiler | Tectonic via `node-latex-compiler`, fallback to `pdflatex` |
| AI — Anthropic | `@anthropic-ai/sdk` (claude-opus-4-5, streaming) |
| AI — OpenAI | `openai` (gpt-4o, streaming) |
| State | Zustand with `localStorage` persistence |
| Icons | Lucide React |

## API routes

### `POST /api/compile`

Accepts a JSON body with all project files and the main file name. Writes them to a temporary directory, runs Tectonic, and returns the compiled PDF as a base64 string along with compiler logs and any extracted error lines.

```json
// Request
{ "files": { "main.tex": "\\documentclass..." }, "mainFile": "main.tex" }

// Response
{ "pdf": "<base64>", "logs": "...", "errors": [], "success": true }
```

### `POST /api/chat`

Accepts a list of messages, optional file context, the chosen model, and the API key. Streams back Server-Sent Events with `{ "text": "..." }` chunks.

```json
// Request
{
  "messages": [{ "role": "user", "content": "Fix my equation" }],
  "context": "File: main.tex\n```latex\n...```",
  "model": "claude",
  "apiKey": "sk-ant-..."
}

// Response: SSE stream
data: {"text":"Here is the corrected"}
data: {"text":" equation:\n```latex\n..."}
```

## Notes

- **No LaTeX installation needed** — Tectonic downloads packages from CTAN automatically on first compile. Subsequent compiles reuse the cache.
- **API keys are client-side only** — they are stored in `localStorage` and sent directly to `/api/chat`, which forwards them to Anthropic or OpenAI. They are never logged or stored server-side.
- **Files are in-memory** — the virtual file system lives in Zustand and is persisted to `localStorage`. There is no server-side file storage.
- For large documents or many packages, the first compile may take 30–60 seconds while Tectonic fetches dependencies.
