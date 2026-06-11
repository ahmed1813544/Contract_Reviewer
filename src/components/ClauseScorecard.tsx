"use client";

import { useState, useMemo } from "react";
import { BarChart3, ChevronDown, ChevronUp, ArrowUp, ArrowDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { ClauseAnalysis } from "@/types";

interface ClauseScorecardProps {
  clauses: ClauseAnalysis[];
}

function getScoreColor(score: number): string {
  if (score >= 8) return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
  if (score >= 6) return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
  if (score >= 4) return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
  return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
}

function getScoreBarColor(score: number): string {
  if (score >= 8) return "bg-emerald-500";
  if (score >= 6) return "bg-amber-500";
  if (score >= 4) return "bg-orange-500";
  return "bg-red-500";
}

export default function ClauseScorecard({ clauses }: ClauseScorecardProps) {
  const [expanded, setExpanded] = useState(false);
  const [sortAsc, setSortAsc] = useState(true);

  const scoredClauses = useMemo(
    () => clauses.filter((c): c is ClauseAnalysis & { clauseScore: number } => typeof c.clauseScore === "number"),
    [clauses]
  );

  const avgScore = useMemo(
    () => scoredClauses.length > 0 ? scoredClauses.reduce((sum, c) => sum + c.clauseScore, 0) / scoredClauses.length : 0,
    [scoredClauses]
  );

  const sorted = useMemo(
    () => [...scoredClauses].sort((a, b) => sortAsc ? a.clauseScore - b.clauseScore : b.clauseScore - a.clauseScore),
    [scoredClauses, sortAsc]
  );

  if (scoredClauses.length === 0) return null;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-indigo-500" />
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            Clause Scorecard
          </h3>
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
            Avg: {avgScore.toFixed(1)}/10
          </span>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-zinc-400" /> : <ChevronDown className="h-4 w-4 text-zinc-400" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4">
              <div className="mb-3 flex items-center justify-end">
                <button
                  onClick={() => setSortAsc(!sortAsc)}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  {sortAsc ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                  {sortAsc ? "Worst first" : "Best first"}
                </button>
              </div>

              <div className="space-y-2">
                {sorted.map((clause, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-xs font-medium text-zinc-700 dark:text-zinc-300">
                          {clause.title}
                        </span>
                        <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold ${getScoreColor(clause.clauseScore)}`}>
                          {clause.clauseScore}/10
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${getScoreBarColor(clause.clauseScore)}`}
                          style={{ width: `${(clause.clauseScore / 10) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
