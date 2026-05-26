"use client";

import { BarChart3 } from "lucide-react";
import type { ClauseAnalysis, RiskLevel } from "@/types";

interface RiskChartProps {
  clauses: ClauseAnalysis[];
  isStreaming?: boolean;
}

interface RiskBucket {
  level: RiskLevel;
  label: string;
  color: string;
  bgColor: string;
  barColor: string;
}

const buckets: RiskBucket[] = [
  {
    level: "low",
    label: "Low Risk",
    color: "text-emerald-700 dark:text-emerald-400",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
    barColor: "bg-emerald-500",
  },
  {
    level: "medium",
    label: "Medium Risk",
    color: "text-amber-700 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
    barColor: "bg-amber-500",
  },
  {
    level: "high",
    label: "High Risk",
    color: "text-orange-700 dark:text-orange-400",
    bgColor: "bg-orange-50 dark:bg-orange-950/30",
    barColor: "bg-orange-500",
  },
  {
    level: "critical",
    label: "Critical Risk",
    color: "text-red-700 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-950/30",
    barColor: "bg-red-500",
  },
];

function countByRisk(clauses: ClauseAnalysis[]): Record<RiskLevel, number> {
  const counts: Record<RiskLevel, number> = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  };
  for (const c of clauses) {
    if (counts[c.riskLevel] !== undefined) counts[c.riskLevel]++;
  }
  return counts;
}

export default function RiskChart({ clauses, isStreaming }: RiskChartProps) {
  const counts = countByRisk(clauses);
  const total = clauses.length;
  const maxCount = Math.max(...Object.values(counts), 1);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-zinc-500" />
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            Risk Distribution
          </h3>
        </div>
        <span className="text-xs tabular-nums text-zinc-400 dark:text-zinc-500">
          {total} clause{total !== 1 ? "s" : ""} analyzed
          {isStreaming && (
            <span className="ml-1 inline-block h-2 w-2 animate-pulse rounded-full bg-indigo-400" />
          )}
        </span>
      </div>

      {/* Bars */}
      <div className="space-y-3">
        {buckets.map((bucket) => {
          const count = counts[bucket.level];
          const pct = total > 0 ? (count / total) * 100 : 0;
          const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;

          return (
            <div key={bucket.level} className="group">
              {/* Label row */}
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${bucket.barColor}`}
                  />
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">
                    {bucket.label}
                  </span>
                </div>
                <span className={`tabular-nums font-semibold ${bucket.color}`}>
                  {count}
                  <span className="ml-1 font-normal text-zinc-400">
                    ({pct.toFixed(0)}%)
                  </span>
                </span>
              </div>

              {/* Bar track */}
              <div className="h-2.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${bucket.barColor}`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary footer */}
      {total > 0 && (
        <div className="mt-4 flex items-center gap-1.5 border-t border-zinc-100 pt-3 text-xs text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
          <span className="font-medium text-zinc-500 dark:text-zinc-400">
            Risk breakdown:
          </span>
          {buckets
            .filter((b) => counts[b.level] > 0)
            .map((b, i, arr) => (
              <span key={b.level}>
                <span className={b.color}>
                  {counts[b.level]} {b.label.toLowerCase()}
                </span>
                {i < arr.length - 1 && <span className="mx-1">&middot;</span>}
              </span>
            ))}
          {buckets.every((b) => counts[b.level] === 0) && (
            <span>No clauses analyzed yet</span>
          )}
        </div>
      )}
    </div>
  );
}
