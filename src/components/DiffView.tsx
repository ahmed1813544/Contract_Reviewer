"use client";

import { useMemo } from "react";
import { diffLines } from "diff";
import type { ContractAnalysis, ClauseAnalysis } from "@/types";

interface DiffViewProps {
  analysisA: ContractAnalysis;
  analysisB: ContractAnalysis;
  labelA?: string;
  labelB?: string;
}

function getClauseKey(c: ClauseAnalysis): string {
  return c.title.toLowerCase().trim();
}

export default function DiffView({ analysisA, analysisB, labelA = "Contract A", labelB = "Contract B" }: DiffViewProps) {
  // Build clause maps
  const clausesA = useMemo(() => {
    const map = new Map<string, ClauseAnalysis>();
    for (const c of analysisA.clauses) map.set(getClauseKey(c), c);
    return map;
  }, [analysisA.clauses]);

  const clausesB = useMemo(() => {
    const map = new Map<string, ClauseAnalysis>();
    for (const c of analysisB.clauses) map.set(getClauseKey(c), c);
    return map;
  }, [analysisB.clauses]);

  // Classify clauses
  const { onlyInA, onlyInB, changed, unchanged } = useMemo(() => {
    const onlyA: ClauseAnalysis[] = [];
    const onlyB: ClauseAnalysis[] = [];
    const ch: { a: ClauseAnalysis; b: ClauseAnalysis }[] = [];
    const same: ClauseAnalysis[] = [];

    const allKeys = new Set([...clausesA.keys(), ...clausesB.keys()]);

    for (const key of allKeys) {
      const a = clausesA.get(key);
      const b = clausesB.get(key);
      if (a && b) {
        // Same clause exists in both — check if text changed
        if (a.clauseText !== b.clauseText || a.riskLevel !== b.riskLevel) {
          ch.push({ a, b });
        } else {
          same.push(a);
        }
      } else if (a) {
        onlyA.push(a);
      } else if (b) {
        onlyB.push(b);
      }
    }

    return { onlyInA: onlyA, onlyInB: onlyB, changed: ch, unchanged: same };
  }, [clausesA, clausesB]);

  const totalClauses = analysisA.clauses.length + analysisB.clauses.length;

  // Summary diff
  const summaryDiff = useMemo(() => {
    return diffLines(analysisA.summary || "", analysisB.summary || "");
  }, [analysisA.summary, analysisB.summary]);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900">
        <h3 className="mb-3 text-sm font-bold text-zinc-900 dark:text-zinc-100">
          Key Differences Summary
        </h3>
        <div className="grid grid-cols-2 gap-4 text-[11px]">
          <div className="space-y-1">
            <span className="font-semibold text-zinc-500">Only in {labelA}:</span>
            {onlyInA.length === 0 ? (
              <p className="text-zinc-400">None</p>
            ) : (
              onlyInA.map((c, i) => (
                <div key={i} className="rounded bg-red-50 px-2 py-1 text-red-700 dark:bg-red-900/20 dark:text-red-400">
                  {c.title} <span className="text-[9px]">[{c.riskLevel}]</span>
                </div>
              ))
            )}
          </div>
          <div className="space-y-1">
            <span className="font-semibold text-zinc-500">Only in {labelB}:</span>
            {onlyInB.length === 0 ? (
              <p className="text-zinc-400">None</p>
            ) : (
              onlyInB.map((c, i) => (
                <div key={i} className="rounded bg-emerald-50 px-2 py-1 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
                  {c.title} <span className="text-[9px]">[{c.riskLevel}]</span>
                </div>
              ))
            )}
          </div>
        </div>
        {changed.length > 0 && (
          <div className="mt-3 space-y-1">
            <span className="text-[11px] font-semibold text-zinc-500">Changed clauses:</span>
            {changed.map((pair, i) => (
              <div key={i} className="flex items-center gap-2 rounded bg-amber-50 px-2 py-1 text-[11px] text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                <span>{pair.a.title}</span>
                <span className="text-[9px]">[{pair.a.riskLevel} → {pair.b.riskLevel}]</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary text diff */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            Summary Diff
          </h3>
          <div className="flex items-center gap-3 text-[10px]">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-red-400" />
              <span className="text-zinc-500">removed</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-zinc-500">added</span>
            </span>
          </div>
        </div>
        <div className="rounded-md bg-zinc-50 p-3 dark:bg-zinc-800/50">
          <p className="text-[11px] leading-relaxed font-mono">
            {summaryDiff.map((change, i) => {
              if (change.added) {
                return (
                  <span key={i} className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                    {change.value}
                  </span>
                );
              }
              if (change.removed) {
                return (
                  <span key={i} className="bg-red-100 text-red-700 line-through dark:bg-red-900/30 dark:text-red-400">
                    {change.value}
                  </span>
                );
              }
              return <span key={i}>{change.value}</span>;
            })}
          </p>
        </div>
      </div>

      {/* Clause-level diff */}
      {changed.length > 0 && (
        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900">
          <h3 className="mb-3 text-sm font-bold text-zinc-900 dark:text-zinc-100">
            Changed Clauses Detail
          </h3>
          <div className="space-y-4">
            {changed.map((pair, i) => {
              const clauseTextDiff = diffLines(pair.a.clauseText, pair.b.clauseText);
              return (
                <div key={i} className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 dark:border-amber-900/30 dark:bg-amber-950/10">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{pair.a.title}</span>
                    <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                      CHANGED
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="rounded bg-white p-2 dark:bg-zinc-900">
                      <span className="text-[9px] font-semibold text-red-500">{labelA}</span>
                      <span className="ml-1 text-[9px] text-zinc-400">[{pair.a.riskLevel}]</span>
                      <p className="mt-1 text-zinc-600 dark:text-zinc-400 leading-relaxed font-mono">
                        {clauseTextDiff.map((change, j) =>
                          change.removed ? (
                            <span key={j} className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                              {change.value}
                            </span>
                          ) : change.added ? null : (
                            <span key={j}>{change.value}</span>
                          )
                        )}
                      </p>
                    </div>
                    <div className="rounded bg-white p-2 dark:bg-zinc-900">
                      <span className="text-[9px] font-semibold text-emerald-500">{labelB}</span>
                      <span className="ml-1 text-[9px] text-zinc-400">[{pair.b.riskLevel}]</span>
                      <p className="mt-1 text-zinc-600 dark:text-zinc-400 leading-relaxed font-mono">
                        {clauseTextDiff.map((change, j) =>
                          change.added ? (
                            <span key={j} className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                              {change.value}
                            </span>
                          ) : change.removed ? null : (
                            <span key={j}>{change.value}</span>
                          )
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
