"use client";

import { useState } from "react";
import { AlertCircle, ChevronDown, ChevronUp, Sparkles, Copy, Check, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { MissingClause } from "@/types";

interface MissingClausesCardProps {
  missingClauses: MissingClause[];
  contractContext?: string;
}

export default function MissingClausesCard({ missingClauses, contractContext }: MissingClausesCardProps) {
  const [expanded, setExpanded] = useState(true);
  const [templates, setTemplates] = useState<Record<number, { template: string; notes: string }>>({});
  const [loading, setLoading] = useState<Set<number>>(new Set());
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const generateTemplate = async (index: number, clauseType: string) => {
    setLoading((prev) => new Set(prev).add(index));

    try {
      const response = await fetch("/api/v1/generate-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clauseType, contractContext }),
      });

      if (!response.ok) throw new Error("Failed to generate template");

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
            } else if (event.type === "done") {
              const match = accumulated.match(/\{[\s\S]*\}/);
              if (match) {
                const parsed = JSON.parse(match[0]);
                setTemplates((prev) => ({
                  ...prev,
                  [index]: { template: parsed.template || "", notes: parsed.notes || "" },
                }));
              }
            }
          } catch {
            // Skip
          }
        }
      }
    } catch (err) {
      console.error("Template generation failed:", err);
    } finally {
      setLoading((prev) => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
    }
  };

  const copyTemplate = (index: number) => {
    const t = templates[index];
    if (t) {
      navigator.clipboard.writeText(t.template).then(() => {
        setCopiedIdx(index);
        setTimeout(() => setCopiedIdx(null), 2000);
      });
    }
  };

  if (!missingClauses.length) return null;

  const highImportance = missingClauses.filter((c) => c.importance === "high");
  const otherImportance = missingClauses.filter((c) => c.importance !== "high");

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <h3 className="text-sm font-bold text-red-800 dark:text-red-300">
            Missing Clauses
          </h3>
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400">
            {missingClauses.length} missing
          </span>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-red-400" /> : <ChevronDown className="h-4 w-4 text-red-400" />}
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
            <div className="space-y-2 px-5 pb-4">
              {highImportance.map((clause) => {
                const idx = missingClauses.indexOf(clause);
                return (
                  <MissingClauseItem
                    key={idx}
                    clause={clause}
                    index={idx}
                    template={templates[idx]}
                    isLoading={loading.has(idx)}
                    isCopied={copiedIdx === idx}
                    onGenerate={generateTemplate}
                    onCopy={copyTemplate}
                  />
                );
              })}
              {otherImportance.map((clause) => {
                const idx = missingClauses.indexOf(clause);
                return (
                  <MissingClauseItem
                    key={idx}
                    clause={clause}
                    index={idx}
                    template={templates[idx]}
                    isLoading={loading.has(idx)}
                    isCopied={copiedIdx === idx}
                    onGenerate={generateTemplate}
                    onCopy={copyTemplate}
                  />
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface MissingClauseItemProps {
  clause: MissingClause;
  index: number;
  template?: { template: string; notes: string };
  isLoading: boolean;
  isCopied: boolean;
  onGenerate: (index: number, clauseType: string) => void;
  onCopy: (index: number) => void;
}

function MissingClauseItem({ clause, index, template, isLoading, isCopied, onGenerate, onCopy }: MissingClauseItemProps) {
  const importanceColors = {
    high: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    low: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  };

  return (
    <div className="rounded-lg border border-red-100 bg-white p-3 dark:border-red-900/30 dark:bg-zinc-900">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase ${importanceColors[clause.importance]}`}>
              {clause.importance}
            </span>
            <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              {clause.clauseType}
            </h4>
          </div>
          <p className="text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
            {clause.description}
          </p>
        </div>
        <button
          onClick={() => onGenerate(index, clause.clauseType)}
          disabled={isLoading || !!template}
          className="flex shrink-0 items-center gap-1 rounded-md bg-indigo-600 px-2.5 py-1 text-[10px] font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Sparkles className="h-3 w-3" />
          )}
          {template ? "Generated" : "Generate"}
        </button>
      </div>

      <AnimatePresence>
        {template && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-3 rounded-md bg-zinc-50 p-3 dark:bg-zinc-800/50">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-semibold uppercase text-zinc-500 dark:text-zinc-400">
                  Template
                </span>
                <button
                  onClick={() => onCopy(index)}
                  className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                >
                  {isCopied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                  {isCopied ? "Copied!" : "Copy"}
                </button>
              </div>
              <p className="text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-300 whitespace-pre-wrap">
                {template.template}
              </p>
              {template.notes && (
                <p className="mt-2 text-[10px] text-zinc-400 italic">
                  {template.notes}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
