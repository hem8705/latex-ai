"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { FileNavigator } from "@/components/FileNavigator";
import { Toolbar } from "@/components/Toolbar";

// Dynamically import components that use browser APIs
const Editor = dynamic(
  () => import("@/components/Editor").then((m) => ({ default: m.Editor })),
  { ssr: false }
);

const PDFPreview = dynamic(
  () =>
    import("@/components/PDFPreview").then((m) => ({ default: m.PDFPreview })),
  { ssr: false }
);

const AIPanel = dynamic(
  () => import("@/components/AIPanel").then((m) => ({ default: m.AIPanel })),
  { ssr: false }
);

const MIN_PANEL_WIDTH = 120;
const MIN_EDITOR_WIDTH = 200;

export default function Home() {
  const [showPdf, setShowPdf] = useState(true);
  const [navWidth, setNavWidth] = useState(200);
  const [aiWidth, setAiWidth] = useState(320);
  const [editorRatio, setEditorRatio] = useState(0.5); // editor vs pdf when both visible

  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingNav = useRef(false);
  const isDraggingAi = useRef(false);
  const isDraggingCenter = useRef(false);

  // Nav resizer
  const startDragNav = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingNav.current = true;

    function onMove(ev: MouseEvent) {
      if (!isDraggingNav.current) return;
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const newWidth = ev.clientX - rect.left;
      setNavWidth(Math.max(MIN_PANEL_WIDTH, Math.min(newWidth, 400)));
    }

    function onUp() {
      isDraggingNav.current = false;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    }

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, []);

  // AI panel resizer
  const startDragAi = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingAi.current = true;

    function onMove(ev: MouseEvent) {
      if (!isDraggingAi.current) return;
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const fromRight = rect.right - ev.clientX;
      setAiWidth(Math.max(MIN_PANEL_WIDTH, Math.min(fromRight, 600)));
    }

    function onUp() {
      isDraggingAi.current = false;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    }

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, []);

  // Center (editor vs pdf) resizer
  const startDragCenter = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingCenter.current = true;

    function onMove(ev: MouseEvent) {
      if (!isDraggingCenter.current) return;
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      // center area starts after nav and ends before ai
      const centerStart = rect.left + navWidth + 4;
      const centerEnd = rect.right - aiWidth - 4;
      const centerWidth = centerEnd - centerStart;
      if (centerWidth <= 0) return;
      const ratio = (ev.clientX - centerStart) / centerWidth;
      setEditorRatio(Math.max(0.15, Math.min(ratio, 0.85)));
    }

    function onUp() {
      isDraggingCenter.current = false;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    }

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, [navWidth, aiWidth]);

  // Prevent text selection while dragging
  useEffect(() => {
    function preventSelect(e: Event) {
      if (
        isDraggingNav.current ||
        isDraggingAi.current ||
        isDraggingCenter.current
      ) {
        e.preventDefault();
      }
    }
    document.addEventListener("selectstart", preventSelect);
    return () => document.removeEventListener("selectstart", preventSelect);
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-black">
      {/* Toolbar */}
      <Toolbar showPdf={showPdf} onTogglePdf={() => setShowPdf((v) => !v)} />

      {/* Main content */}
      <div ref={containerRef} className="flex flex-1 min-h-0 overflow-hidden">
        {/* File Navigator */}
        <div
          style={{ width: navWidth, minWidth: navWidth }}
          className="flex-shrink-0 border-r border-[#1a1a1a] overflow-hidden"
        >
          <FileNavigator />
        </div>

        {/* Nav resize handle */}
        <div
          className="resize-handle resize-handle-vertical"
          onMouseDown={startDragNav}
        />

        {/* Editor + PDF area */}
        <div className="flex flex-1 min-w-0 overflow-hidden">
          {/* Monaco editor */}
          <div
            style={{
              flex: showPdf ? `0 0 ${editorRatio * 100}%` : "1 1 0",
              minWidth: MIN_EDITOR_WIDTH,
              overflow: "hidden",
            }}
          >
            <Editor />
          </div>

          {/* Center resize handle (only visible when pdf shown) */}
          {showPdf && (
            <div
              className="resize-handle resize-handle-vertical"
              onMouseDown={startDragCenter}
            />
          )}

          {/* PDF Preview */}
          {showPdf && (
            <div
              style={{
                flex: `0 0 ${(1 - editorRatio) * 100}%`,
                minWidth: MIN_EDITOR_WIDTH,
                overflow: "hidden",
              }}
              className="border-l border-[#1a1a1a]"
            >
              <PDFPreview />
            </div>
          )}
        </div>

        {/* AI panel resize handle */}
        <div
          className="resize-handle resize-handle-vertical"
          onMouseDown={startDragAi}
        />

        {/* AI Panel */}
        <div
          style={{ width: aiWidth, minWidth: aiWidth }}
          className="flex-shrink-0 border-l border-[#1a1a1a] overflow-hidden"
        >
          <AIPanel />
        </div>
      </div>
    </div>
  );
}
