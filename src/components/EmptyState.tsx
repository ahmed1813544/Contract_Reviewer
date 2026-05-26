"use client";

import { Scale, Shield, FileSearch, ArrowRight } from "lucide-react";

const features = [
  {
    icon: FileSearch,
    title: "Instant Analysis",
    description: "Upload any PDF contract and get AI-powered analysis in seconds",
  },
  {
    icon: Shield,
    title: "Risk Assessment",
    description: "Identify risky clauses with color-coded risk levels",
  },
  {
    icon: Scale,
    title: "Legal Insights",
    description: "Plain-English explanations and actionable recommendations",
  },
];

export default function EmptyState() {
  return (
    <div className="flex flex-col items-center py-12">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-xl shadow-indigo-500/20">
          <Scale className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          Analyze Your Contract
        </h2>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Drop a PDF above to get started — no signup required
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-5 text-center dark:border-zinc-700 dark:bg-zinc-900"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/40">
              <feature.icon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {feature.title}
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
              {feature.description}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-10 flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500">
        <span>All processing happens locally</span>
        <ArrowRight className="h-3 w-3" />
        <span>Powered by Ollama + llama3.2</span>
      </div>
    </div>
  );
}
