"use client";

import { Scale, ArrowRightLeft, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { ContractAnalysis } from "@/types";
import RiskBadge from "./RiskBadge";

interface CompareHeaderProps {
  contractA: ContractAnalysis;
  contractB: ContractAnalysis;
  fileNameA?: string;
  fileNameB?: string;
}

function getRiskLabel(score: number): string {
  if (score <= 3) return "low";
  if (score <= 5) return "medium";
  if (score <= 7) return "high";
  return "critical";
}

function riskScoreColor(score: number): string {
  if (score <= 3) return "text-emerald-600 dark:text-emerald-400";
  if (score <= 5) return "text-amber-600 dark:text-amber-400";
  if (score <= 7) return "text-orange-600 dark:text-orange-400";
  return "text-red-600 dark:text-red-400";
}

function getTrendIcon(diff: number) {
  if (diff > 0) return { icon: TrendingUp, color: "text-red-500" };
  if (diff < 0) return { icon: TrendingDown, color: "text-emerald-500" };
  return { icon: Minus, color: "text-zinc-400" };
}

function getRiskCounts(a: ContractAnalysis, b: ContractAnalysis) {
  const countA = { low: 0, medium: 0, high: 0, critical: 0 };
  const countB = { low: 0, medium: 0, high: 0, critical: 0 };
  for (const c of a.clauses) {
    if (c.riskLevel in countA) countA[c.riskLevel]++;
  }
  for (const c of b.clauses) {
    if (c.riskLevel in countB) countB[c.riskLevel]++;
  }
  return { countA, countB };
}

export default function CompareHeader({
  contractA,
  contractB,
  fileNameA,
  fileNameB,
}: CompareHeaderProps) {
  const scoreDiff = contractB.overallRiskScore - contractA.overallRiskScore;
  const Trend = getTrendIcon(scoreDiff);
  const { countA, countB } = getRiskCounts(contractA, contractB);
  const highRiskA = countA.high + countA.critical;
  const highRiskB = countB.high + countB.critical;

  const sameType =
    contractA.contractType?.toLowerCase() === contractB.contractType?.toLowerCase() &&
    contractA.contractType?.length > 0;

  const clausesDiff = contractB.clauses.length - contractA.clauses.length;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900">
      {/* Title */}
      <div className="mb-4 flex items-center gap-2">
        <ArrowRightLeft className="h-4 w-4 text-indigo-500" />
        <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
          Contract Comparison
        </h2>
        <span className="text-xs text-zinc-400">
          {fileNameA && fileNameB
            ? `${fileNameA} vs ${fileNameB}`
            : "Side-by-side analysis"}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
        {/* Contract A */}
        <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400">
              A
            </div>
            <span className="truncate text-xs font-medium text-zinc-700 dark:text-zinc-300">
              {fileNameA || "Contract A"}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-bold ${riskScoreColor(contractA.overallRiskScore)}`}>
              {contractA.overallRiskScore}
            </span>
            <span className="text-xs text-zinc-400">/10</span>
            <RiskBadge level={getRiskLabel(contractA.overallRiskScore) as "low" | "medium" | "high" | "critical"} size="sm" />
          </div>
          <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            {contractA.clauses.length} clause{contractA.clauses.length !== 1 ? "s" : ""}
            {highRiskA > 0 && ` · ${highRiskA} high/critical`}
          </div>
        </div>

        {/* Contract B */}
        <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-[10px] font-bold text-purple-700 dark:bg-purple-900/40 dark:text-purple-400">
              B
            </div>
            <span className="truncate text-xs font-medium text-zinc-700 dark:text-zinc-300">
              {fileNameB || "Contract B"}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-bold ${riskScoreColor(contractB.overallRiskScore)}`}>
              {contractB.overallRiskScore}
            </span>
            <span className="text-xs text-zinc-400">/10</span>
            <RiskBadge level={getRiskLabel(contractB.overallRiskScore) as "low" | "medium" | "high" | "critical"} size="sm" />
          </div>
          <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            {contractB.clauses.length} clause{contractB.clauses.length !== 1 ? "s" : ""}
            {highRiskB > 0 && ` · ${highRiskB} high/critical`}
          </div>
        </div>
      </div>

      {/* Key Differences */}
      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-zinc-100 pt-3 dark:border-zinc-800">
        <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
          Key differences:
        </span>

        {/* Score difference */}
        {scoreDiff !== 0 && (
          <div className="flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 dark:bg-zinc-800">
            <Trend.icon className={`h-3 w-3 ${Trend.color}`} />
            <span className="text-[11px] tabular-nums text-zinc-600 dark:text-zinc-400">
              Risk score {scoreDiff > 0 ? "higher" : "lower"} by {Math.abs(scoreDiff)} points
            </span>
          </div>
        )}

        {/* Contract type match */}
        {contractA.contractType && contractB.contractType && (
          <div className="flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 dark:bg-zinc-800">
            <Scale className="h-3 w-3 text-zinc-400" />
            <span className="text-[11px] text-zinc-600 dark:text-zinc-400">
              {sameType
                ? `Both are ${contractA.contractType}`
                : `${contractA.contractType} vs ${contractB.contractType}`}
            </span>
          </div>
        )}

        {/* Clause count difference */}
        {clausesDiff !== 0 && (
          <div className="flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 dark:bg-zinc-800">
            <span className="text-[11px] tabular-nums text-zinc-600 dark:text-zinc-400">
              {clausesDiff > 0
                ? `Contract B has ${clausesDiff} more clauses`
                : `Contract A has ${Math.abs(clausesDiff)} more clauses`}
            </span>
          </div>
        )}

        {scoreDiff === 0 && sameType && clausesDiff === 0 && (
          <span className="text-[11px] text-zinc-400">
            No major structural differences
          </span>
        )}
      </div>
    </div>
  );
}
