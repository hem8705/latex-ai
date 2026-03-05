"use client";

import { useState, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { useEditorStore } from "@/lib/store";
import {
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Download,
  FileX,
  Loader2,
} from "lucide-react";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export function PDFPreview() {
  const { compiledPdf, isCompiling, compileErrors, compileLogs } =
    useEditorStore();

  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [showLogs, setShowLogs] = useState(false);

  const onDocumentLoadSuccess = useCallback(
    ({ numPages }: { numPages: number }) => {
      setNumPages(numPages);
      setPageNumber(1);
    },
    []
  );

  function zoomIn() {
    setScale((s) => Math.min(s + 0.25, 3));
  }

  function zoomOut() {
    setScale((s) => Math.max(s - 0.25, 0.5));
  }

  function prevPage() {
    setPageNumber((p) => Math.max(p - 1, 1));
  }

  function nextPage() {
    setPageNumber((p) => Math.min(p + 1, numPages));
  }

  function downloadPdf() {
    if (!compiledPdf) return;
    const bytes = atob(compiledPdf);
    const arr = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
    const blob = new Blob([arr], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "document.pdf";
    a.click();
    URL.revokeObjectURL(url);
  }

  const pdfData = compiledPdf
    ? { data: atob(compiledPdf) }
    : null;

  return (
    <div className="flex flex-col h-full bg-[#252526]">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#1e1e1e] bg-[#2d2d2d] shrink-0">
        <div className="flex items-center gap-1">
          <button
            onClick={prevPage}
            disabled={pageNumber <= 1}
            className="p-1 rounded hover:bg-[#3d3d3d] text-[#858585] hover:text-[#cccccc] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-xs text-[#858585] min-w-[80px] text-center">
            {compiledPdf ? `${pageNumber} / ${numPages}` : "— / —"}
          </span>
          <button
            onClick={nextPage}
            disabled={pageNumber >= numPages}
            className="p-1 rounded hover:bg-[#3d3d3d] text-[#858585] hover:text-[#cccccc] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={zoomOut}
            className="p-1 rounded hover:bg-[#3d3d3d] text-[#858585] hover:text-[#cccccc] transition-colors"
          >
            <ZoomOut size={14} />
          </button>
          <span className="text-xs text-[#858585] w-12 text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={zoomIn}
            className="p-1 rounded hover:bg-[#3d3d3d] text-[#858585] hover:text-[#cccccc] transition-colors"
          >
            <ZoomIn size={14} />
          </button>
        </div>

        <div className="flex items-center gap-1">
          {compileLogs && (
            <button
              onClick={() => setShowLogs(!showLogs)}
              className={`text-xs px-2 py-0.5 rounded transition-colors ${
                compileErrors.length > 0
                  ? "text-red-400 hover:bg-red-900/20"
                  : "text-green-400 hover:bg-green-900/20"
              }`}
            >
              {compileErrors.length > 0
                ? `${compileErrors.length} error${compileErrors.length > 1 ? "s" : ""}`
                : "Logs"}
            </button>
          )}
          <button
            onClick={downloadPdf}
            disabled={!compiledPdf}
            className="p-1 rounded hover:bg-[#3d3d3d] text-[#858585] hover:text-[#cccccc] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Download PDF"
          >
            <Download size={14} />
          </button>
        </div>
      </div>

      {/* Compile logs panel */}
      {showLogs && compileLogs && (
        <div className="shrink-0 max-h-40 overflow-y-auto bg-[#1e1e1e] border-b border-[#2d2d2d] p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#858585] uppercase tracking-wider">
              Compile Output
            </span>
            <button
              onClick={() => setShowLogs(false)}
              className="text-xs text-[#858585] hover:text-[#cccccc]"
            >
              ✕
            </button>
          </div>
          {compileErrors.length > 0 && (
            <div className="mb-2 space-y-1">
              {compileErrors.map((err, i) => (
                <div key={i} className="text-xs text-red-400 font-mono">
                  {err}
                </div>
              ))}
            </div>
          )}
          <pre className="text-xs text-[#858585] font-mono whitespace-pre-wrap leading-relaxed">
            {compileLogs}
          </pre>
        </div>
      )}

      {/* PDF Content */}
      <div className="flex-1 overflow-auto flex items-start justify-center p-4 min-h-0">
        {isCompiling ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-[#858585]">
            <Loader2 size={28} className="animate-spin" />
            <span className="text-sm">Compiling…</span>
          </div>
        ) : compiledPdf ? (
          <div className="shadow-2xl">
            <Document
              file={pdfData}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={
                <div className="flex items-center justify-center p-8 text-[#858585]">
                  <Loader2 size={20} className="animate-spin mr-2" />
                  Loading PDF…
                </div>
              }
              error={
                <div className="flex flex-col items-center justify-center p-8 text-red-400 gap-2">
                  <FileX size={24} />
                  <span className="text-sm">Failed to load PDF</span>
                </div>
              }
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                className="bg-white"
              />
            </Document>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-[#858585]">
            <FileX size={32} className="opacity-30" />
            <div className="text-center">
              <p className="text-sm">No PDF yet</p>
              <p className="text-xs mt-1 opacity-60">
                Click Compile or press ⌘↵
              </p>
            </div>
            {compileErrors.length > 0 && (
              <div className="mt-2 max-w-sm w-full bg-red-950/30 border border-red-800/50 rounded p-3">
                <p className="text-xs font-semibold text-red-400 mb-2">
                  Compile errors:
                </p>
                <div className="space-y-1">
                  {compileErrors.slice(0, 5).map((err, i) => (
                    <p key={i} className="text-xs text-red-300 font-mono">
                      {err}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
