"use client";

import { AlertTriangle } from "lucide-react";

export default function DisclaimerBanner() {
  return (
    <div className="border-t border-zinc-800 bg-zinc-950/50 px-4 py-2">
      <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 text-center">
        <AlertTriangle className="h-3 w-3 shrink-0 text-amber-500" />
        <p className="text-[11px] text-zinc-500">
          This tool provides AI-assisted analysis for informational purposes only and
          does not constitute legal advice. Always consult a qualified attorney.
        </p>
      </div>
    </div>
  );
}
