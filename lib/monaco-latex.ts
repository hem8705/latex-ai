import type * as Monaco from "monaco-editor";

export function registerLatexLanguage(monaco: typeof Monaco) {
  monaco.languages.register({ id: "latex" });

  monaco.languages.setMonarchTokensProvider("latex", {
    tokenizer: {
      root: [
        // Comments
        [/%.*$/, "comment"],

        // Begin/end environments (highlighted differently)
        [/\\(begin|end)\{[^}]*\}/, "keyword.control"],

        // Common structural commands
        [
          /\\(documentclass|usepackage|newcommand|renewcommand|def|let|newenvironment|renewenvironment)(?=[^a-zA-Z]|$)/,
          "keyword",
        ],

        // Section commands
        [
          /\\(part|chapter|section|subsection|subsubsection|paragraph|subparagraph)\*?(?=[^a-zA-Z]|$)/,
          "keyword.section",
        ],

        // Text formatting
        [
          /\\(textbf|textit|texttt|emph|underline|overline|text|mathrm|mathbf|mathit|mathtt|mathbb|mathcal|mathfrak)(?=[^a-zA-Z]|$)/,
          "keyword.formatting",
        ],

        // Math environments inline: $...$
        [/\$\$/, { token: "string.math.double", next: "@mathDouble" }],
        [/\$/, { token: "string.math", next: "@math" }],

        // Display math \[...\]
        [/\\\[/, { token: "string.math.display", next: "@displayMath" }],

        // Math \(...\)
        [/\\\(/, { token: "string.math", next: "@inlineMath" }],

        // Backslash commands
        [/\\[a-zA-Z]+\*?/, "variable"],

        // Special escape sequences
        [/\\[^a-zA-Z]/, "string.escape"],

        // Braces and brackets
        [/[{}]/, "delimiter.curly"],
        [/[\[\]]/, "delimiter.bracket"],

        // Numbers
        [/\d+(\.\d+)?/, "number"],

        // Special LaTeX characters
        [/[&~^_]/, "operator"],
      ],

      math: [
        [/\$/, { token: "string.math", next: "@pop" }],
        [/\\[a-zA-Z]+\*?/, "variable.math"],
        [/[{}]/, "delimiter.curly"],
        [/[\[\]]/, "delimiter.bracket"],
        [/[+\-*/=<>!|^_]/, "operator.math"],
        [/\d+(\.\d+)?/, "number"],
        [/[a-zA-Z]+/, "identifier.math"],
        [/%.*$/, "comment"],
      ],

      mathDouble: [
        [/\$\$/, { token: "string.math.double", next: "@pop" }],
        [/\\[a-zA-Z]+\*?/, "variable.math"],
        [/[{}]/, "delimiter.curly"],
        [/[+\-*/=<>!|^_]/, "operator.math"],
        [/\d+(\.\d+)?/, "number"],
        [/[a-zA-Z]+/, "identifier.math"],
        [/%.*$/, "comment"],
      ],

      displayMath: [
        [/\\\]/, { token: "string.math.display", next: "@pop" }],
        [/\\[a-zA-Z]+\*?/, "variable.math"],
        [/[{}]/, "delimiter.curly"],
        [/[+\-*/=<>!|^_]/, "operator.math"],
        [/\d+(\.\d+)?/, "number"],
        [/[a-zA-Z]+/, "identifier.math"],
        [/%.*$/, "comment"],
      ],

      inlineMath: [
        [/\\\)/, { token: "string.math", next: "@pop" }],
        [/\\[a-zA-Z]+\*?/, "variable.math"],
        [/[{}]/, "delimiter.curly"],
        [/[+\-*/=<>!|^_]/, "operator.math"],
        [/\d+(\.\d+)?/, "number"],
        [/[a-zA-Z]+/, "identifier.math"],
        [/%.*$/, "comment"],
      ],
    },
  });

  monaco.languages.setLanguageConfiguration("latex", {
    comments: { lineComment: "%" },
    brackets: [
      ["{", "}"],
      ["[", "]"],
      ["(", ")"],
    ],
    autoClosingPairs: [
      { open: "{", close: "}" },
      { open: "[", close: "]" },
      { open: "(", close: ")" },
      { open: "$", close: "$" },
    ],
    surroundingPairs: [
      { open: "{", close: "}" },
      { open: "[", close: "]" },
      { open: "(", close: ")" },
      { open: "$", close: "$" },
    ],
    indentationRules: {
      increaseIndentPattern: /\\begin\{[^}]*\}\s*$/,
      decreaseIndentPattern: /^\\end\{[^}]*\}/,
    },
  });

  // Define a dark theme matching VSCode dark+
  monaco.editor.defineTheme("latex-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment", foreground: "6A9955", fontStyle: "italic" },
      { token: "keyword", foreground: "C586C0" },
      { token: "keyword.control", foreground: "569CD6", fontStyle: "bold" },
      { token: "keyword.section", foreground: "DCDCAA", fontStyle: "bold" },
      { token: "keyword.formatting", foreground: "4EC9B0" },
      { token: "variable", foreground: "9CDCFE" },
      { token: "variable.math", foreground: "CE9178" },
      { token: "string.math", foreground: "CE9178" },
      { token: "string.math.double", foreground: "CE9178" },
      { token: "string.math.display", foreground: "CE9178" },
      { token: "string.escape", foreground: "D7BA7D" },
      { token: "delimiter.curly", foreground: "FFD700" },
      { token: "delimiter.bracket", foreground: "DA70D6" },
      { token: "operator", foreground: "D4D4D4" },
      { token: "operator.math", foreground: "D4D4D4" },
      { token: "number", foreground: "B5CEA8" },
      { token: "identifier.math", foreground: "9CDCFE" },
    ],
    colors: {
      "editor.background": "#1E1E1E",
    },
  });

  // Completions for common LaTeX commands
  monaco.languages.registerCompletionItemProvider("latex", {
    triggerCharacters: ["\\"],
    provideCompletionItems(model, position) {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn - 1,
        endColumn: word.endColumn,
      };

      const snippets: Monaco.languages.CompletionItem[] = [
        {
          label: "\\begin",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: "\\begin{${1:environment}}\n\t$0\n\\end{${1:environment}}",
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: "Begin/end environment",
          range,
        },
        {
          label: "\\frac",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: "\\frac{${1:numerator}}{${2:denominator}}",
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: "Fraction",
          range,
        },
        {
          label: "\\sqrt",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: "\\sqrt{${1:expression}}",
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: "Square root",
          range,
        },
        {
          label: "\\sum",
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: "\\sum_{${1:i=0}}^{${2:n}}",
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: "Summation",
          range,
        },
        {
          label: "\\int",
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: "\\int_{${1:a}}^{${2:b}} ${3:f(x)}\\,d${4:x}",
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: "Integral",
          range,
        },
        {
          label: "\\textbf",
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: "\\textbf{${1:text}}",
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: "Bold text",
          range,
        },
        {
          label: "\\textit",
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: "\\textit{${1:text}}",
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: "Italic text",
          range,
        },
        {
          label: "\\section",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: "\\section{${1:title}}",
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: "Section",
          range,
        },
        {
          label: "\\subsection",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: "\\subsection{${1:title}}",
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: "Subsection",
          range,
        },
        {
          label: "\\label",
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: "\\label{${1:key}}",
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: "Label",
          range,
        },
        {
          label: "\\ref",
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: "\\ref{${1:key}}",
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: "Reference",
          range,
        },
        {
          label: "\\cite",
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: "\\cite{${1:key}}",
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: "Citation",
          range,
        },
        {
          label: "\\usepackage",
          kind: monaco.languages.CompletionItemKind.Module,
          insertText: "\\usepackage{${1:package}}",
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: "Use package",
          range,
        },
      ];

      return { suggestions: snippets };
    },
  });
}
