"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, AlertTriangle, Lightbulb } from "lucide-react";
import clsx from "clsx";
import RiskBadge from "./RiskBadge";
import type { ClauseAnalysis } from "@/types";

interface ClauseCardProps {
  clause: ClauseAnalysis;
  index: number;
  compact?: boolean;
}

export default function ClauseCard({ clause, index, compact = false }: ClauseCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={clsx(
        "group rounded-xl border transition-all duration-200",
        "border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-sm",
        "dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600"
      )}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        aria-label={expanded ? "Collapse clause details" : "Expand clause details"}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
            {index + 1}
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
              {clause.title}
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <RiskBadge level={clause.riskLevel} size="sm" />
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-zinc-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-zinc-400" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-zinc-100 px-5 pb-5 pt-4 dark:border-zinc-800">
          <div className={compact ? "space-y-3" : "space-y-4"}>
            <div>
              <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Clause Text
              </h4>
              <p className="rounded-lg bg-zinc-50 p-3 text-xs leading-relaxed text-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-300">
                &ldquo;{clause.clauseText}&rdquo;
              </p>
            </div>

            <div className={compact ? "grid gap-3 grid-cols-1" : "grid gap-4 sm:grid-cols-2"}>
              <div>
                <div className="mb-1.5 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-zinc-500" />
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Analysis
                  </h4>
                </div>
                <p className={`leading-relaxed text-zinc-600 dark:text-zinc-400 ${compact ? "text-xs" : "text-sm"}`}>
                  {clause.explanation}
                </p>
              </div>

              <div>
                <div className="mb-1.5 flex items-center gap-1.5">
                  <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Recommendation
                  </h4>
                </div>
                <p className={`leading-relaxed text-zinc-600 dark:text-zinc-400 ${compact ? "text-xs" : "text-sm"}`}>
                  {clause.recommendation}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
