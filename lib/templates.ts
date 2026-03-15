import type { Template } from "@/types";

const articleBasic = `\\documentclass[12pt]{article}

\\usepackage{amsmath}
\\usepackage{amssymb}
\\usepackage{geometry}
\\usepackage{hyperref}
\\geometry{margin=1in}

\\title{Article Title}
\\author{Author Name}
\\date{\\today}

\\begin{document}

\\maketitle

\\begin{abstract}
Your abstract goes here. Summarize your paper in 150-300 words.
\\end{abstract}

\\section{Introduction}
Introduce your topic and state your thesis.

\\section{Methods}
Describe your methodology.

\\section{Results}
Present your findings.

\\section{Discussion}
Interpret your results.

\\section{Conclusion}
Summarize your main points.

\\bibliographystyle{plain}
\\bibliography{references}

\\end{document}`;

const thesis = `\\documentclass[12pt,oneside]{book}

\\usepackage{amsmath}
\\usepackage{amssymb}
\\usepackage{geometry}
\\usepackage{hyperref}
\\usepackage{graphicx}
\\usepackage{setspace}
\\geometry{margin=1.5in}
\\doublespacing

\\title{Thesis Title}
\\author{Your Name}
\\date{\\today}

\\begin{document}

\\frontmatter
\\maketitle

\\chapter*{Abstract}
Your thesis abstract goes here.

\\chapter*{Acknowledgments}
Thank those who helped you.

\\tableofcontents

\\mainmatter

\\chapter{Introduction}
\\section{Background}
Provide context for your research.

\\section{Research Questions}
State your research questions or hypotheses.

\\chapter{Literature Review}
Review existing literature.

\\chapter{Methodology}
Describe your approach.

\\chapter{Results}
Present your findings here.

\\chapter{Discussion}
Discuss what your results mean.

\\chapter{Conclusion}
Summarize main findings.

\\backmatter
\\bibliographystyle{plain}
\\bibliography{references}

\\end{document}`;

const ieeeConference = `\\documentclass[conference]{IEEEtran}

\\usepackage{cite}
\\usepackage{amsmath,amssymb,amsfonts}
\\usepackage{graphicx}
\\usepackage{textcomp}
\\usepackage{xcolor}

\\begin{document}

\\title{Paper Title}

\\author{
\\IEEEauthorblockN{First Author}
\\IEEEauthorblockA{Department, University\\\\
City, Country\\\\
email@example.com}
}

\\maketitle

\\begin{abstract}
This document is a template for IEEE conference papers.
\\end{abstract}

\\begin{IEEEkeywords}
keyword1, keyword2, keyword3
\\end{IEEEkeywords}

\\section{Introduction}
Introduce your research problem and contributions.

\\section{Related Work}
Discuss relevant prior work.

\\section{Methodology}
Describe your approach.

\\section{Experiments}
Present your results.

\\section{Conclusion}
Summarize contributions and future work.

\\bibliographystyle{IEEEtran}
\\bibliography{references}

\\end{document}`;

const beamerPresentation = `\\documentclass{beamer}

\\usetheme{Madrid}
\\usecolortheme{default}
\\usepackage{graphicx}

\\title{Presentation Title}
\\subtitle{Subtitle Here}
\\author{Author Name}
\\institute{Institution}
\\date{\\today}

\\begin{document}

\\begin{frame}
\\titlepage
\\end{frame}

\\begin{frame}{Outline}
\\tableofcontents
\\end{frame}

\\section{Introduction}

\\begin{frame}{Introduction}
\\begin{itemize}
    \\item First point
    \\item Second point
    \\item Third point
\\end{itemize}
\\end{frame}

\\section{Main Content}

\\begin{frame}{Key Concepts}
\\begin{block}{Definition}
Important definition here.
\\end{block}

\\begin{alertblock}{Important}
Critical information.
\\end{alertblock}
\\end{frame}

\\section{Conclusion}

\\begin{frame}{Conclusion}
\\begin{itemize}
    \\item Summary point 1
    \\item Summary point 2
\\end{itemize}
\\end{frame}

\\begin{frame}{Questions?}
\\centering
\\Huge Thank you!
\\end{frame}

\\end{document}`;

const technicalReport = `\\documentclass[11pt]{report}

\\usepackage{amsmath}
\\usepackage{graphicx}
\\usepackage{hyperref}
\\usepackage{geometry}
\\geometry{margin=1in}

\\title{Technical Report\\\\
\\large Project Name}
\\author{Author Name}
\\date{\\today}

\\begin{document}

\\maketitle

\\begin{abstract}
Executive summary of the technical report.
\\end{abstract}

\\tableofcontents

\\chapter{Introduction}
\\section{Purpose}
State the purpose of this report.

\\section{Scope}
Define the scope and boundaries.

\\chapter{System Overview}
Describe the system architecture.

\\chapter{Technical Details}
Detailed implementation information.

\\chapter{Conclusion}
Summarize key points.

\\end{document}`;

const formalLetter = `\\documentclass[12pt]{letter}

\\usepackage{geometry}
\\geometry{margin=1in}

\\signature{Your Name}
\\address{Your Address\\\\City, State ZIP}

\\begin{document}

\\begin{letter}{Recipient Name\\\\Organization\\\\Address}

\\opening{Dear Recipient:}

First paragraph: State your purpose clearly.

Second paragraph: Provide supporting details.

Third paragraph: State what action you want.

\\closing{Sincerely,}

\\end{letter}

\\end{document}`;

const academicCV = `\\documentclass[11pt,a4paper]{article}

\\usepackage{geometry}
\\usepackage{enumitem}
\\usepackage{hyperref}
\\geometry{margin=0.75in}

\\begin{document}

\\begin{center}
{\\LARGE\\bfseries Your Name}\\\\[6pt]
Address | City, State | email@example.com
\\end{center}

\\section*{Education}
\\textbf{University Name} \\hfill City, State\\\\
Ph.D. in Field \\hfill Expected: Year

\\section*{Experience}
\\textbf{Position Title} \\hfill Date Range\\\\
Organization Name
\\begin{itemize}
    \\item Description of responsibilities
\\end{itemize}

\\section*{Publications}
\\begin{enumerate}
    \\item Author. Title. Journal, Year.
\\end{enumerate}

\\section*{Skills}
Programming: Python, R, LaTeX

\\end{document}`;

const mathHomework = `\\documentclass[12pt]{article}

\\usepackage{amsmath}
\\usepackage{amssymb}
\\usepackage{amsthm}
\\usepackage{geometry}
\\geometry{margin=1in}

\\newtheorem{theorem}{Theorem}
\\theoremstyle{definition}
\\newtheorem*{solution}{Solution}

\\title{Homework Assignment}
\\author{Your Name}
\\date{\\today}

\\begin{document}

\\maketitle

\\section*{Problem 1}
State the problem here.

\\begin{solution}
Write your solution here.

For inline math: $f(x) = x^2 + 2x + 1$

For display math:
\\[
\\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}
\\]
\\end{solution}

\\section*{Problem 2}
Prove that $\\sqrt{2}$ is irrational.

\\begin{proof}
Your proof here.
\\end{proof}

\\end{document}`;

const blankDocument = `\\documentclass[12pt]{article}

\\usepackage{amsmath}
\\usepackage{geometry}
\\geometry{margin=1in}

\\title{Document Title}
\\author{Author Name}
\\date{\\today}

\\begin{document}

\\maketitle

% Start writing here

\\end{document}`;

export const TEMPLATES: Template[] = [
  {
    id: "article-basic",
    name: "Basic Article",
    description: "Simple article with sections and bibliography",
    category: "academic",
    packages: ["amsmath", "amssymb", "geometry", "hyperref"],
    content: articleBasic,
  },
  {
    id: "thesis",
    name: "Thesis/Dissertation",
    description: "Multi-chapter thesis with front matter",
    category: "academic",
    packages: ["amsmath", "amssymb", "geometry", "hyperref", "graphicx", "setspace"],
    content: thesis,
  },
  {
    id: "ieee-conference",
    name: "IEEE Conference Paper",
    description: "Two-column IEEE conference format",
    category: "academic",
    packages: ["cite", "amsmath", "graphicx"],
    content: ieeeConference,
  },
  {
    id: "beamer-presentation",
    name: "Beamer Presentation",
    description: "Modern slide presentation",
    category: "presentation",
    packages: ["beamer", "graphicx"],
    content: beamerPresentation,
  },
  {
    id: "technical-report",
    name: "Technical Report",
    description: "Detailed technical documentation",
    category: "report",
    packages: ["amsmath", "graphicx", "hyperref", "geometry"],
    content: technicalReport,
  },
  {
    id: "formal-letter",
    name: "Formal Letter",
    description: "Professional business letter",
    category: "letter",
    packages: ["geometry"],
    content: formalLetter,
  },
  {
    id: "cv-resume",
    name: "Academic CV",
    description: "Professional curriculum vitae",
    category: "custom",
    packages: ["geometry", "enumitem", "hyperref"],
    content: academicCV,
  },
  {
    id: "math-homework",
    name: "Math Homework",
    description: "Problem sets with theorem styling",
    category: "academic",
    packages: ["amsmath", "amssymb", "amsthm", "geometry"],
    content: mathHomework,
  },
  {
    id: "blank",
    name: "Blank Document",
    description: "Minimal starting point",
    category: "custom",
    packages: [],
    content: blankDocument,
  },
];

export function getTemplatesByCategory(category: Template["category"]): Template[] {
  return TEMPLATES.filter((t) => t.category === category);
}

export function getTemplateById(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id);
}
