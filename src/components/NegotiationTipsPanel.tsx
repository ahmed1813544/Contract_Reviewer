"use client";

import { useState } from "react";
import { MessageSquare, Copy, Check, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { NegotiationTip, RiskLevel } from "@/types";

interface NegotiationTipsPanelProps {
  tips: NegotiationTip[];
}

function getRiskColor(riskLevel: RiskLevel): string {
  switch (riskLevel) {
    case "low": return "text-emerald-500";
    case "medium": return "text-amber-500";
    case "high": return "text-orange-500";
    case "critical": return "text-red-500";
  }
}

function getRiskBg(riskLevel: RiskLevel): string {
  switch (riskLevel) {
    case "low": return "bg-emerald-500/10 border-emerald-500/20";
    case "medium": return "bg-amber-500/10 border-amber-500/20";
    case "high": return "bg-orange-500/10 border-orange-500/20";
    case "critical": return "bg-red-500/10 border-red-500/20";
  }
}

export default function NegotiationTipsPanel({ tips }: NegotiationTipsPanelProps) {
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const sortedTips = [...tips].sort((a, b) => b.priority - a.priority);

  const toggleCheck = (index: number) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const copyAll = () => {
    const text = sortedTips
      .map((tip, i) => `${i + 1}. [${tip.riskLevel.toUpperCase()}] ${tip.tip}`)
      .join("\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!tips.length) return null;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded(!expanded)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setExpanded(!expanded);
          }
        }}
        className="flex w-full cursor-pointer items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-indigo-500" />
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            Negotiation Tips
          </h3>
          <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
            {tips.length} tips
          </span>
        </div>
        <div className="flex items-center gap-2">
          {expanded && (
            <button
              onClick={(e) => { e.stopPropagation(); copyAll(); }}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            >
              {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
              {copied ? "Copied!" : "Copy All"}
            </button>
          )}
          {expanded ? <ChevronUp className="h-4 w-4 text-zinc-400" /> : <ChevronDown className="h-4 w-4 text-zinc-400" />}
        </div>
      </div>

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
              {sortedTips.map((tip, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-3 rounded-lg border p-3 transition-all ${getRiskBg(tip.riskLevel)}`}
                >
                  <button
                    onClick={() => toggleCheck(i)}
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-all ${
                      checked.has(i)
                        ? "border-indigo-500 bg-indigo-500 text-white"
                        : "border-zinc-300 bg-white dark:border-zinc-600 dark:bg-zinc-800"
                    }`}
                  >
                    {checked.has(i) && (
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold uppercase ${getRiskColor(tip.riskLevel)}`}>
                        {tip.riskLevel}
                      </span>
                      <span className="text-[10px] text-zinc-400">
                        {tip.clauseTitle}
                      </span>
                    </div>
                    <p className={`text-xs leading-relaxed ${checked.has(i) ? "text-zinc-400 line-through" : "text-zinc-700 dark:text-zinc-300"}`}>
                      {tip.tip}
                    </p>
                  </div>
                </div>
              ))}
              <div className="text-[11px] text-zinc-400 pt-1">
                {checked.size}/{tips.length} completed
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
