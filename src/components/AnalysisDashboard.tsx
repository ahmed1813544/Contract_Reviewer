"use client";

import { useState } from "react";
import { AlertTriangle, FileText, Users, Calendar, RefreshCw, Loader2, MapPin, AlertCircle, BookOpen } from "lucide-react";
import type { ContractAnalysis } from "@/types";
import ClauseCard from "./ClauseCard";
import RiskBadge from "./RiskBadge";
import RiskChart from "./RiskChart";
import ExportReportButton from "./ExportReportButton";
import NegotiationTipsPanel from "./NegotiationTipsPanel";
import MissingClausesCard from "./MissingClausesCard";
import ClauseScorecard from "./ClauseScorecard";

interface AnalysisDashboardProps {
  analysis: ContractAnalysis;
  onReset: () => void;
  isStreaming?: boolean;
  clauseCount?: number;
  compact?: boolean;
  slotLabel?: string;
  fileName?: string;
}

function getOverallRiskLabel(score: number): string {
  if (score <= 3) return "low";
  if (score <= 5) return "medium";
  if (score <= 7) return "high";
  return "critical";
}

function computeDynamicScore(analysis: ContractAnalysis): number {
  const scoredClauses = analysis.clauses.filter(
    (c) => typeof c.clauseScore === "number"
  );
  if (scoredClauses.length === 0) return analysis.overallRiskScore;
  const avgScore = scoredClauses.reduce((sum, c) => sum + c.clauseScore!, 0) / scoredClauses.length;
  // Convert 1-10 clause score (10=best) to risk score (10=worst)
  const riskScore = Math.round(10 - avgScore + 1);
  return Math.min(10, Math.max(1, riskScore));
}

export default function AnalysisDashboard({
  analysis,
  onReset,
  isStreaming = false,
  clauseCount,
  compact = false,
  slotLabel,
  fileName,
}: AnalysisDashboardProps) {
  const [showPlainEnglish, setShowPlainEnglish] = useState(false);

  // Feature 9: Dynamically calculated score from clause scores
  const dynamicScore = computeDynamicScore(analysis);
  const displayScore = dynamicScore || analysis.overallRiskScore;

  const riskLevel = getOverallRiskLabel(displayScore) as
    | "low"
    | "medium"
    | "high"
    | "critical";

  const riskColor =
    riskLevel === "low"
      ? "from-emerald-500 to-green-600"
      : riskLevel === "medium"
      ? "from-amber-500 to-orange-600"
      : riskLevel === "high"
      ? "from-orange-500 to-red-600"
      : "from-red-500 to-rose-600";

  const riskBg =
    riskLevel === "low"
      ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900"
      : riskLevel === "medium"
      ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900"
      : riskLevel === "high"
      ? "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900"
      : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900";

  const hasSummary = analysis.summary && analysis.summary.length > 0;
  const hasKeyFindings = analysis.keyFindings && analysis.keyFindings.length > 0;
  const hasClauses = analysis.clauses && analysis.clauses.length > 0;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 pb-12">
      {/* Streaming indicator */}
      {isStreaming && (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 dark:border-indigo-800 dark:bg-indigo-950/20">
          <Loader2 className="h-4 w-4 animate-spin text-indigo-600 dark:text-indigo-400" />
          <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
            Receiving analysis
            {clauseCount !== undefined && ` \u2022 ${clauseCount} clause${clauseCount !== 1 ? "s" : ""} found so far`}
            ...
          </span>
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
          {isStreaming ? "Analysis in Progress" : "Analysis Results"}
          {slotLabel && !compact && (
            <span className="ml-2 text-sm font-normal text-zinc-400">
              ({slotLabel === "A" ? "Contract A" : "Contract B"})
            </span>
          )}
        </h2>
        <div className="flex items-center gap-2">
          {/* Feature 8: Plain English Toggle */}
          {!compact && !isStreaming && analysis.plainEnglishSummary && (
            <button
              onClick={() => setShowPlainEnglish(!showPlainEnglish)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                showPlainEnglish
                  ? "border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400"
                  : "border-zinc-300 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              {showPlainEnglish ? "Legal View" : "Plain English"}
            </button>
          )}

          {/* Feature 1: Export Report Button */}
          {!compact && !isStreaming && (
            <ExportReportButton analysis={analysis} fileName={fileName || "contract"} />
          )}

          {!compact && (
            <button
              onClick={onReset}
              aria-label="Analyze another contract"
              className="flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              New Analysis
            </button>
          )}
        </div>
      </div>

      {/* Overall Risk Score */}
      {displayScore > 0 && (
        <div className={`rounded-xl border p-6 ${riskBg}`}>
          <div className="flex flex-col items-center text-center sm:flex-row sm:text-left gap-4 sm:gap-6">
            <div
              className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${riskColor} shadow-lg`}
            >
              <span className="text-3xl font-bold text-white">
                {displayScore}
              </span>
            </div>
            <div className="flex-1">
              <div className="mb-2 flex items-center justify-center gap-2 sm:justify-start">
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Overall Risk Score
                </h3>
                <RiskBadge level={riskLevel} size="sm" />
                {/* Feature 10: Not Legal Advice badge */}
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[9px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                  Not Legal Advice
                </span>
              </div>
              <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                {showPlainEnglish && analysis.plainEnglishSummary
                  ? analysis.plainEnglishSummary
                  : analysis.summary || "Generating summary..."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Info Grid */}
      <div className={`grid gap-4 ${compact ? "grid-cols-1" : "sm:grid-cols-2 lg:grid-cols-4"}`}>
        <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
            <FileText className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
          </div>
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Contract Type</p>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {analysis.contractType || "Detecting..."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
            <Users className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
          </div>
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Parties</p>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate max-w-[150px]">
              {analysis.parties?.length ? analysis.parties.join(", ") : "Detecting..."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
            <Calendar className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
          </div>
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Effective Date</p>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {analysis.effectiveDate || "Detecting..."}
            </p>
          </div>
        </div>

        {/* Feature 4: Jurisdiction card */}
        {!compact && (
          <div className={`flex items-center gap-3 rounded-xl border p-4 ${
            analysis.jurisdiction && analysis.jurisdiction !== "Not specified"
              ? "border-indigo-200 bg-indigo-50 dark:border-indigo-900 dark:bg-indigo-950/20"
              : "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20"
          }`}>
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
              analysis.jurisdiction && analysis.jurisdiction !== "Not specified"
                ? "bg-indigo-100 dark:bg-indigo-900/40"
                : "bg-amber-100 dark:bg-amber-900/40"
            }`}>
              <MapPin className={`h-5 w-5 ${
                analysis.jurisdiction && analysis.jurisdiction !== "Not specified"
                  ? "text-indigo-600 dark:text-indigo-400"
                  : "text-amber-600 dark:text-amber-400"
              }`} />
            </div>
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Jurisdiction</p>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {analysis.jurisdiction && analysis.jurisdiction !== "Not specified"
                  ? analysis.jurisdiction
                  : "Not Specified"}
              </p>
              {!analysis.jurisdiction || analysis.jurisdiction === "Not specified" ? (
                <p className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-0.5">
                  <AlertCircle className="h-3 w-3" />
                  No governing law detected
                </p>
              ) : analysis.jurisdictionNotes ? (
                <p className="text-[10px] text-indigo-600 dark:text-indigo-400 mt-0.5">
                  {analysis.jurisdictionNotes}
                </p>
              ) : null}
            </div>
          </div>
        )}
      </div>

      {/* Risk Distribution Chart */}
      {hasClauses && !compact && (
        <RiskChart clauses={analysis.clauses} isStreaming={isStreaming} />
      )}

      {/* Key Findings */}
      {hasKeyFindings && (
        <div>
          <h3 className="mb-3 text-sm font-bold text-zinc-900 dark:text-zinc-100">
            <span className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Key Findings
              {isStreaming && <span className="text-xs font-normal text-zinc-400">(loading...)</span>}
            </span>
          </h3>
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
            <ul className="space-y-2">
              {analysis.keyFindings.map((finding, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[10px] font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    {i + 1}
                  </span>
                  <span className="text-zinc-700 dark:text-zinc-300">{finding}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Feature 7: Missing Clauses */}
      {!compact && !isStreaming && analysis.missingClauses && analysis.missingClauses.length > 0 && (
        <MissingClausesCard missingClauses={analysis.missingClauses} contractContext={analysis.summary} />
      )}

      {/* Feature 3: Negotiation Tips */}
      {!compact && !isStreaming && analysis.negotiationTips && analysis.negotiationTips.length > 0 && (
        <NegotiationTipsPanel tips={analysis.negotiationTips} />
      )}

      {/* Feature 9: Clause Scorecard */}
      {!compact && analysis.clauses && analysis.clauses.length > 0 && (
        <ClauseScorecard clauses={analysis.clauses} />
      )}

      {/* Clause-by-Clause Analysis */}
      {hasClauses && (
        <div>
          <h3 className={`mb-4 font-bold text-zinc-900 dark:text-zinc-100 ${compact ? "text-xs" : "text-sm"}`}>
            Clause Analysis{" "}
            <span className="font-normal text-zinc-400">
              ({analysis.clauses.length} clause{analysis.clauses.length !== 1 ? "s" : ""}
              {isStreaming ? " and counting..." : ""})
            </span>
          </h3>
          <div className="space-y-3">
            {analysis.clauses.map((clause, i) => (
              <ClauseCard
                key={i}
                clause={clause}
                index={i}
                compact={compact}
                showPlainEnglish={showPlainEnglish}
              />
            ))}
            {isStreaming && (
              <div className="flex items-center justify-center rounded-xl border border-dashed border-zinc-300 px-5 py-4 dark:border-zinc-600">
                <Loader2 className="mr-2 h-4 w-4 animate-spin text-zinc-400" />
                <span className="text-sm text-zinc-400">More clauses arriving...</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
