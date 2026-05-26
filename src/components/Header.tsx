"use client";

import { Scale } from "lucide-react";

export default function Header() {
  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">
            <Scale className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
              ContractReviewer
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              AI-Powered Contract Analysis
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden text-xs text-zinc-400 dark:text-zinc-500 sm:block">
            Powered by AI
          </span>
        </div>
      </div>
    </header>
  );
}
