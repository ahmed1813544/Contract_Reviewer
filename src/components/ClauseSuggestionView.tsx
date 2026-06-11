"use client";

import { useState, useMemo, useCallback } from "react";
import { Wand2, Copy, Check, Loader2, ChevronDown, ChevronUp, X } from "lucide-react";
import { diffWords } from "diff";
import type { ClauseAnalysis, ClauseSuggestion } from "@/types";

interface ClauseSuggestionViewProps {
  clause: ClauseAnalysis;
}

export default function ClauseSuggestionView({ clause }: ClauseSuggestionViewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<ClauseSuggestion | null>(null);
  const [streamingText, setStreamingText] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);

  const changes = useMemo(() => {
    if (!suggestion) return [];
    return diffWords(suggestion.originalClause, suggestion.suggestedClause);
  }, [suggestion]);

  const fetchSuggestion = useCallback(async () => {
    if (suggestion) {
      setIsOpen(true);
      return;
    }

    setIsOpen(true);
    setIsLoading(true);
    setError(null);
    setStreamingText("");

    try {
      const response = await fetch("/api/v1/suggest-clause", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clauseText: clause.clauseText, clauseTitle: clause.title }),
      });

      if (!response.ok) throw new Error("Failed to get suggestion");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No stream");

      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const event = JSON.parse(trimmed);
            if (event.type === "chunk") {
              accumulated += event.text;
              setStreamingText(accumulated);
            } else if (event.type === "done") {
              const match = accumulated.match(/\{[\s\S]*\}/);
              if (match) {
                const parsed = JSON.parse(match[0]);
                setSuggestion({
                  originalClause: parsed.originalClause || clause.clauseText,
                  suggestedClause: parsed.suggestedClause || "",
                  explanation: parsed.explanation || "",
                  changes: [],
                });
              }
            }
          } catch {
            // Skip
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate suggestion");
    } finally {
      setIsLoading(false);
    }
  }, [clause, suggestion]);

  const copySuggestion = useCallback(() => {
    if (suggestion) {
      navigator.clipboard.writeText(suggestion.suggestedClause).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }, [suggestion]);

  return (
    <div className="mt-2">
      <button
        onClick={fetchSuggestion}
        disabled={isLoading}
        className="flex items-center gap-1.5 rounded-lg bg-indigo-600/10 px-3 py-1.5 text-[11px] font-medium text-indigo-600 transition-colors hover:bg-indigo-600/20 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20 disabled:opacity-50"
      >
        {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
        {suggestion ? "View Suggestion" : "Suggest Fix"}
      </button>

      {isOpen && (
        <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50">
          <div className="flex items-center justify-between border-b border-zinc-200 px-3 py-2 dark:border-zinc-700">
            <span className="text-[10px] font-semibold uppercase text-zinc-500 dark:text-zinc-400">
              Suggested Redline
            </span>
            <div className="flex items-center gap-1">
              {suggestion && (
                <button
                  onClick={copySuggestion}
                  className="flex items-center gap-1 rounded px-2 py-0.5 text-[10px] text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                >
                  {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                  {copied ? "Copied!" : "Copy"}
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="rounded p-0.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>

          {isLoading && !suggestion ? (
            <div className="p-3">
              <div className="text-[11px] text-zinc-400 italic">
                {streamingText ? "Generating suggestion..." : "Analyzing clause..."}
              </div>
              {streamingText && (
                <div className="mt-2 max-h-40 overflow-y-auto rounded bg-white p-2 text-[10px] text-zinc-500 dark:bg-zinc-900">
                  {streamingText.slice(-500)}
                </div>
              )}
            </div>
          ) : error ? (
            <div className="p-3 text-[11px] text-red-500">{error}</div>
          ) : suggestion ? (
            <div className="p-3 space-y-3">
              {/* Diff view using diff package */}
              <div>
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="flex items-center gap-1 text-[10px] font-semibold uppercase text-zinc-500 dark:text-zinc-400 mb-1.5"
                >
                  {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
                  Changes
                </button>
                {expanded && (
                  <div className="rounded-md bg-white p-2 dark:bg-zinc-900">
                    <p className="text-[11px] leading-relaxed font-mono">
                      {changes.map((change, i) => {
                        if (change.added) {
                          return (
                            <span key={i} className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                              {change.value}
                            </span>
                          );
                        }
                        if (change.removed) {
                          return (
                            <span key={i} className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 line-through">
                              {change.value}
                            </span>
                          );
                        }
                        return <span key={i}>{change.value}</span>;
                      })}
                    </p>
                  </div>
                )}
              </div>

              {/* Explanation */}
              <div>
                <h4 className="text-[10px] font-semibold uppercase text-zinc-500 dark:text-zinc-400 mb-1">
                  What Changed
                </h4>
                <p className="text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-300">
                  {suggestion.explanation}
                </p>
              </div>

              {/* Full suggested text */}
              <div>
                <h4 className="text-[10px] font-semibold uppercase text-zinc-500 dark:text-zinc-400 mb-1">
                  Suggested Rewrite
                </h4>
                <div className="rounded-md bg-white p-2 dark:bg-zinc-900">
                  <p className="text-[11px] leading-relaxed text-zinc-700 dark:text-zinc-300">
                    &ldquo;{suggestion.suggestedClause}&rdquo;
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
