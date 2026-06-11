"use client";

import { useEffect, useState } from "react";
import {
  History,
  Trash2,
  X,
  FileText,
  Clock,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { HistoryEntry, ContractAnalysis } from "@/types";

const STORAGE_KEY = "contract-reviewer-history";

export function loadHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** Truncate clause texts to prevent localStorage overflow */
function truncateForStorage(analysis: ContractAnalysis): ContractAnalysis {
  return {
    ...analysis,
    clauses: analysis.clauses.map((c) => ({
      ...c,
      clauseText: c.clauseText.length > 200 ? c.clauseText.slice(0, 200) + "..." : c.clauseText,
      explanation: c.explanation.length > 500 ? c.explanation.slice(0, 500) + "..." : c.explanation,
      recommendation: c.recommendation.length > 500 ? c.recommendation.slice(0, 500) + "..." : c.recommendation,
    })),
  };
}

export function saveToHistory(fileName: string, result: ContractAnalysis): HistoryEntry {
  const entry: HistoryEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    fileName,
    date: new Date().toISOString(),
    result: truncateForStorage(result),
  };

  const history = loadHistory();
  history.unshift(entry);
  const trimmed = history.slice(0, 50);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // If storage is full, remove oldest entries and try again
    const reduced = trimmed.slice(0, 10);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reduced));
    } catch {
      // Give up silently
    }
  }
  return entry;
}

export function deleteHistoryEntry(id: string) {
  const history = loadHistory();
  const filtered = history.filter((e) => e.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export function clearHistory() {
  localStorage.removeItem(STORAGE_KEY);
}

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onLoad: (entry: HistoryEntry) => void;
}

function getRiskColor(score: number): string {
  if (score <= 3) return "text-emerald-400";
  if (score <= 5) return "text-amber-400";
  if (score <= 7) return "text-orange-400";
  return "text-red-400";
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function HistorySidebar({ isOpen, onClose, onLoad }: HistorySidebarProps) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    if (isOpen) {
      setEntries(loadHistory());
    }
  }, [isOpen]);

  const handleDelete = (id: string) => {
    deleteHistoryEntry(id);
    setEntries(loadHistory());
  };

  const handleClearAll = () => {
    clearHistory();
    setEntries([]);
  };

  const handleLoad = (entry: HistoryEntry) => {
    onLoad(entry);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-zinc-800 bg-[#0a0a0a] shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-indigo-400" />
                <h2 className="text-sm font-bold text-zinc-100">Analysis History</h2>
                <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">
                  {entries.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {entries.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="text-xs text-zinc-500 hover:text-red-400 transition-colors"
                  >
                    Clear All
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Entries */}
            <div className="flex-1 overflow-y-auto">
              {entries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <History className="mb-3 h-8 w-8 text-zinc-700" />
                  <p className="text-sm text-zinc-500">No analysis history yet</p>
                  <p className="mt-1 text-xs text-zinc-600">
                    Analyzed contracts will appear here
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-800/50">
                  {entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="group flex items-start gap-3 px-4 py-3 transition-colors hover:bg-zinc-900/50"
                    >
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-800">
                        <FileText className="h-4 w-4 text-zinc-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-zinc-200">
                          {entry.fileName}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-zinc-600" />
                            <span className="text-[11px] text-zinc-500">
                              {formatDate(entry.date)}
                            </span>
                          </div>
                          <span
                            className={`text-[11px] font-semibold ${getRiskColor(
                              entry.result.overallRiskScore
                            )}`}
                          >
                            Risk: {entry.result.overallRiskScore}/10
                          </span>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="rounded p-1 text-zinc-500 hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleLoad(entry)}
                          className="rounded p-1 text-zinc-500 hover:text-indigo-400 transition-colors"
                          title="Load analysis"
                        >
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
