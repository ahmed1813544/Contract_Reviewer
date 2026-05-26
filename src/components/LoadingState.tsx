"use client";

import { useEffect, useState } from "react";
import { FileText, Search, Brain, Sparkles } from "lucide-react";
import clsx from "clsx";

interface LoadingStateProps {
  status: "uploading" | "parsing" | "analyzing";
  fileName?: string;
}

const steps = [
  { key: "uploading", label: "Uploading document", icon: FileText },
  { key: "parsing", label: "Extracting text", icon: Search },
  { key: "analyzing", label: "AI is analyzing your contract", icon: Brain },
] as const;

export default function LoadingState({ status, fileName }: LoadingStateProps) {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "" : d + "."));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="relative mb-8">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-xl shadow-indigo-500/20">
          <Brain className="h-10 w-10 animate-pulse text-white" />
        </div>
        <div className="absolute -bottom-2 -right-2">
          <Sparkles className="h-6 w-6 text-amber-400" />
        </div>
      </div>

      <div className="mb-8 space-y-4">
        {steps.map((step) => {
          const isActive = step.key === status;
          const isComplete =
            (status === "parsing" && step.key === "uploading") ||
            (status === "analyzing" &&
              (step.key === "uploading" || step.key === "parsing"));

          return (
            <div key={step.key} className="flex items-center gap-3">
              <div
                className={clsx(
                  "flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300",
                  isComplete &&
                    "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
                  isActive &&
                    "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400",
                  !isActive &&
                    !isComplete &&
                    "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500"
                )}
              >
                {isComplete ? (
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <step.icon className="h-4 w-4" />
                )}
              </div>
              <span
                className={clsx(
                  "text-sm font-medium transition-colors duration-300",
                  isComplete && "text-emerald-600 dark:text-emerald-400",
                  isActive && "text-indigo-600 dark:text-indigo-400",
                  !isActive &&
                    !isComplete &&
                    "text-zinc-400 dark:text-zinc-500"
                )}
              >
                {step.label}
                {isActive && (
                  <span className="inline-block w-6 animate-pulse">{dots}</span>
                )}
              </span>
            </div>
          );
        })}
      </div>

      {status === "analyzing" && (
        <div className="h-1.5 w-64 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
          <div className="h-full w-full animate-pulse rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" />
        </div>
      )}

      {fileName && (
        <p className="mt-4 text-xs text-zinc-400 dark:text-zinc-500">
          Analyzing: {fileName}
        </p>
      )}
    </div>
  );
}
