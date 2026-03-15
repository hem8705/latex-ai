"use client";

import { useState } from "react";
import { useEditorStore } from "@/lib/store";
import type { PlanItem } from "@/types";
import {
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  ChevronRight,
  ChevronDown,
  ListTodo,
  Sparkles,
} from "lucide-react";

interface PlanItemProps {
  item: PlanItem;
  depth?: number;
}

function PlanItemRow({ item, depth = 0 }: PlanItemProps) {
  const { updatePlanItem, removePlanItem, addPlanItem } = useEditorStore();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newItemText, setNewItemText] = useState("");

  const hasChildren = item.children && item.children.length > 0;

  function handleAddChild() {
    if (newItemText.trim()) {
      addPlanItem(newItemText.trim(), item.id);
      setNewItemText("");
      setIsAdding(false);
    }
  }

  return (
    <div className="group">
      <div
        className={`flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-[#1a1a1a] transition-colors ${
          item.completed ? "opacity-60" : ""
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {hasChildren && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-0.5 text-[#666] hover:text-white transition-colors"
          >
            {isExpanded ? (
              <ChevronDown size={12} />
            ) : (
              <ChevronRight size={12} />
            )}
          </button>
        )}
        {!hasChildren && <div className="w-4" />}

        <button
          onClick={() => updatePlanItem(item.id, !item.completed)}
          className="text-[#666] hover:text-[#fbbf24] transition-colors"
        >
          {item.completed ? (
            <CheckCircle2 size={14} className="text-[#fbbf24]" />
          ) : (
            <Circle size={14} />
          )}
        </button>

        <span
          className={`flex-1 text-sm ${
            item.completed ? "line-through text-[#666]" : "text-white"
          }`}
        >
          {item.text}
        </span>

        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
          <button
            onClick={() => setIsAdding(true)}
            className="p-1 text-[#666] hover:text-[#fbbf24] transition-colors"
            title="Add subtask"
          >
            <Plus size={12} />
          </button>
          <button
            onClick={() => removePlanItem(item.id)}
            className="p-1 text-[#666] hover:text-red-400 transition-colors"
            title="Remove"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {isAdding && (
        <div
          className="flex items-center gap-2 py-1.5 px-2"
          style={{ paddingLeft: `${(depth + 1) * 16 + 8}px` }}
        >
          <Circle size={14} className="text-[#666]" />
          <input
            type="text"
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddChild();
              if (e.key === "Escape") {
                setIsAdding(false);
                setNewItemText("");
              }
            }}
            placeholder="Add subtask..."
            className="flex-1 bg-transparent text-white text-sm outline-none placeholder-[#666]"
            autoFocus
          />
          <button
            onClick={handleAddChild}
            className="text-xs text-[#fbbf24] hover:text-[#f59e0b] px-2"
          >
            Add
          </button>
          <button
            onClick={() => {
              setIsAdding(false);
              setNewItemText("");
            }}
            className="text-xs text-[#666] hover:text-white px-2"
          >
            Cancel
          </button>
        </div>
      )}

      {hasChildren && isExpanded && (
        <div>
          {item.children!.map((child) => (
            <PlanItemRow key={child.id} item={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function PlanPanel() {
  const { activePlan, addPlanItem, setActivePlan, planMode } = useEditorStore();
  const [newItemText, setNewItemText] = useState("");
  const [planTitle, setPlanTitle] = useState(activePlan?.title || "Plan");

  if (!planMode) return null;

  const completedCount =
    activePlan?.items.filter((item) => item.completed).length || 0;
  const totalCount = activePlan?.items.length || 0;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  function handleAddItem() {
    if (newItemText.trim()) {
      addPlanItem(newItemText.trim());
      setNewItemText("");
    }
  }

  function handleUpdateTitle() {
    if (activePlan && planTitle.trim() !== activePlan.title) {
      setActivePlan({
        ...activePlan,
        title: planTitle.trim(),
        updatedAt: Date.now(),
      });
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] border-t border-[#1a1a1a]">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#1a1a1a]">
        <div className="flex items-center gap-2">
          <ListTodo size={14} className="text-[#fbbf24]" />
          <input
            type="text"
            value={planTitle}
            onChange={(e) => setPlanTitle(e.target.value)}
            onBlur={handleUpdateTitle}
            className="text-xs font-semibold text-white bg-transparent outline-none border-b border-transparent focus:border-[#fbbf24] transition-colors"
          />
        </div>
        {totalCount > 0 && (
          <span className="text-[10px] text-[#666]">
            {completedCount}/{totalCount} completed
          </span>
        )}
      </div>

      {/* Progress bar */}
      {totalCount > 0 && (
        <div className="px-3 py-2 border-b border-[#1a1a1a]">
          <div className="h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#fbbf24] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Items */}
      <div className="flex-1 overflow-y-auto p-2 min-h-0">
        {!activePlan || activePlan.items.length === 0 ? (
          <div className="text-center py-8 space-y-3">
            <Sparkles size={24} className="mx-auto text-[#fbbf24] opacity-50" />
            <div className="text-xs text-[#666] space-y-1">
              <p className="text-[#999]">No plan items yet</p>
              <p className="opacity-60">
                Add items below or ask AI to create a plan
              </p>
            </div>
          </div>
        ) : (
          <div>
            {activePlan.items.map((item) => (
              <PlanItemRow key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>

      {/* Add item input */}
      <div className="px-3 py-2 border-t border-[#1a1a1a]">
        <div className="flex items-center gap-2 bg-[#1a1a1a] rounded-lg px-3 py-2">
          <Plus size={14} className="text-[#666]" />
          <input
            type="text"
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddItem();
            }}
            placeholder="Add a task..."
            className="flex-1 bg-transparent text-white text-xs outline-none placeholder-[#666]"
          />
          {newItemText.trim() && (
            <button
              onClick={handleAddItem}
              className="text-xs text-[#fbbf24] hover:text-[#f59e0b] transition-colors"
            >
              Add
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
