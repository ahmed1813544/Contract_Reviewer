"use client";

import { RefreshCw, Plus } from "lucide-react";
import type { AnalysisSlot } from "@/types";
import AnalysisDashboard from "./AnalysisDashboard";
import CompareHeader from "./CompareHeader";

interface CompareViewProps {
  firstSlot: AnalysisSlot;
  secondSlot: AnalysisSlot;
  onAddSecond: () => void;
  onReset: () => void;
  onResetSecond: () => void;
}

export default function CompareView({
  firstSlot,
  secondSlot,
  onAddSecond,
  onReset,
  onResetSecond,
}: CompareViewProps) {
  const firstDone = firstSlot.status === "complete" && firstSlot.result;
  const secondDone = secondSlot.status === "complete" && secondSlot.result;
  const showComparison = firstDone && secondDone;

  const secondExists = secondSlot.status !== "idle";

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 pb-12">
      {/* Top controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            {showComparison ? "Comparison Results" : "Analysis Results"}
          </h2>
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Start Over
        </button>
      </div>

      {/* Comparison header (only when both are complete) */}
      {showComparison && firstSlot.result && secondSlot.result && (
        <CompareHeader
          contractA={firstSlot.result}
          contractB={secondSlot.result}
          fileNameA={firstSlot.fileName}
          fileNameB={secondSlot.fileName}
        />
      )}

      {/* Side-by-side dashboards */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Column A */}
        <div>
          {/* Slot label */}
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400">
              A
            </div>
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {firstSlot.fileName || "Contract A"}
            </span>
          </div>
          <AnalysisDashboard
            analysis={firstSlot.result!}
            onReset={onReset}
            isStreaming={firstSlot.status === "streaming"}
            clauseCount={firstSlot.clauseCount}
            compact={true}
            slotLabel="A"
          />
        </div>

        {/* Column B */}
        <div>
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-[10px] font-bold text-purple-700 dark:bg-purple-900/40 dark:text-purple-400">
                B
              </div>
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                {secondSlot.fileName || "Contract B"}
              </span>
            </div>

            {/* Show "remove" button if second analysis exists */}
            {secondExists && !showComparison && (
              <button
                onClick={onResetSecond}
                className="text-xs text-zinc-400 hover:text-red-500 transition-colors"
              >
                Remove
              </button>
            )}
          </div>            {secondSlot.status === "idle" ? (
              /* Upload prompt */
              <button
                onClick={onAddSecond}
                className="flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-zinc-300 px-6 py-12 text-center transition-all hover:border-indigo-400 hover:bg-indigo-50 dark:border-zinc-700 dark:hover:border-indigo-500 dark:hover:bg-indigo-950/20"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/40">
                  <Plus className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    Add Contract for Comparison
                  </p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    Upload another PDF to compare side by side
                  </p>
                </div>
              </button>
            ) : secondSlot.status === "uploading" || secondSlot.status === "parsing" ? (
              /* Loading state for second slot */
              <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-200 bg-white px-6 py-12 dark:border-zinc-700 dark:bg-zinc-900">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/40">
                  <svg
                    className="h-6 w-6 animate-spin text-indigo-600 dark:text-indigo-400"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                </div>
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  {secondSlot.status === "uploading"
                    ? "Uploading contract..."
                    : "Parsing contract..."}
                </p>
                {secondSlot.fileName && (
                  <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                    {secondSlot.fileName}
                  </p>
                )}
              </div>
            ) : secondSlot.status === "error" ? (
              /* Error state */
              <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900 dark:bg-red-950/20">
                <p className="mb-3 text-sm text-red-600 dark:text-red-400">
                  {secondSlot.error || "Failed to analyze this contract."}
                </p>
                <button
                  onClick={onAddSecond}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
                >
                  Retry
                </button>
              </div>
            ) : (
              /* Second slot analysis dashboard (streaming or complete) */
              secondSlot.result && (
                <AnalysisDashboard
                  analysis={secondSlot.result}
                  onReset={onResetSecond}
                  isStreaming={secondSlot.status === "streaming"}
                  clauseCount={secondSlot.clauseCount}
                  compact={true}
                  slotLabel="B"
                />
              )
            )}
        </div>
      </div>
    </div>
  );
}
