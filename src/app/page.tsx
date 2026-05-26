"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Header from "@/components/Header";
import FileUpload from "@/components/FileUpload";
import LoadingState from "@/components/LoadingState";
import EmptyState from "@/components/EmptyState";
import AnalysisDashboard from "@/components/AnalysisDashboard";
import CompareView from "@/components/CompareView";
import { streamParse, sanitizeAnalysis, extractJsonFromText } from "@/lib/stream-json";
import type { AnalysisState, AnalysisSlot } from "@/types";
import type { ContractAnalysis } from "@/types";

// ─── Helpers to run one analysis flow ──────────────────────────────────────

async function fetchWithRetry(
  url: string,
  formData: FormData,
  retries = 1,
  signal?: AbortSignal
): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, { method: "POST", body: formData, signal });
      return res;
    } catch (err) {
      if (i === retries) throw err;
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  throw new Error("All retries failed");
}

async function runAnalysis(
  file: File,
  onUpdate: (updater: (prev: AnalysisSlot) => AnalysisSlot) => void,
  mountedRef: React.MutableRefObject<boolean>,
) {
  onUpdate(() => ({ status: "uploading", fileName: file.name }));

  await new Promise((r) => setTimeout(r, 500));
  if (!mountedRef.current) return;
  onUpdate((prev) => ({ ...prev, status: "parsing" }));

  await new Promise((r) => setTimeout(r, 300));
  if (!mountedRef.current) return;

  try {
    const formData = new FormData();
    formData.append("file", file);

    const abortController = new AbortController();

    const response = await fetchWithRetry(
      "/api/analyze-contract",
      formData,
      1,
      abortController.signal
    );

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      if (!mountedRef.current) return;
      onUpdate(() => ({
        status: "error" as const,
        error: data.error || `Server error (${response.status})`,
        fileName: file.name,
      }));
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      if (!mountedRef.current) return;
      onUpdate(() => ({
        status: "error" as const,
        error: "Stream not available",
        fileName: file.name,
      }));
      return;
    }

    const decoder = new TextDecoder();
    let buffer = "";
    let accumulatedTokens = "";
    let hasReceivedData = false;
    let previousPartial: ContractAnalysis | null = null;

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
            accumulatedTokens += event.text;

            if (!hasReceivedData) {
              hasReceivedData = true;
              if (mountedRef.current) {
                onUpdate(() => ({ status: "streaming" as const, fileName: file.name }));
              }
            }

            if (mountedRef.current) {
              const partial = streamParse(accumulatedTokens, previousPartial);
              if (partial) {
                previousPartial = partial;
                onUpdate(() => ({
                  status: "streaming" as const,
                  fileName: file.name,
                  result: partial,
                  clauseCount: partial.clauses.length,
                }));
              }
            }
          } else if (event.type === "done") {
            if (mountedRef.current) {
              try {
                const jsonStr = extractJsonFromText(accumulatedTokens);
                if (jsonStr) {
                  const raw = JSON.parse(jsonStr);
                  const fullResult = sanitizeAnalysis(raw);
                  onUpdate(() => ({
                    status: "complete" as const,
                    fileName: file.name,
                    result: fullResult,
                    clauseCount: fullResult.clauses.length,
                  }));
                } else {
                  onUpdate((prev) => ({
                    ...prev,
                    status: "complete" as const,
                    fileName: file.name,
                  }));
                }
              } catch {
                onUpdate((prev) => ({
                  ...prev,
                  status: "complete" as const,
                  fileName: file.name,
                }));
              }
            }
          } else if (event.type === "error") {
            if (mountedRef.current) {
              onUpdate(() => ({
                status: "error" as const,
                error: event.message || "Analysis failed",
                fileName: file.name,
              }));
            }
          }
        } catch {
          // Skip malformed JSON lines
        }
      }
    }

    // Stream ended but no "done" event
    if (hasReceivedData && mountedRef.current) {
      onUpdate((prev) => {
        if (prev.status === "streaming") {
          return { ...prev, status: "complete" as const, fileName: file.name };
        }
        return prev;
      });
    }
  } catch (err) {
    if (!mountedRef.current) return;
    const message =
      err instanceof Error
        ? err.message
        : "Failed to connect to the server. Please try again.";
    if (message.includes("out of memory") || message.includes("abort")) return;

    onUpdate(() => ({
      status: "error" as const,
      error: message,
      fileName: file.name,
    }));
  }
}

// ─── Context-aware error help ──────────────────────────────────────────────

const getErrorHelp = (errMsg: string) => {
  if (errMsg.toLowerCase().includes("openrouter") || errMsg.includes("401") || errMsg.includes("unauthorized"))
    return { help: "Your OpenRouter API key is invalid or expired. Get a new one at:", code: "https://openrouter.ai/keys" };
  if (errMsg.includes("configuration error"))
    return { help: "The server is not configured with an API key. Contact the administrator." };
  if (errMsg.includes("timeout") || errMsg.includes("timed out"))
    return { help: "Try a shorter contract, or wait and try again." };
  if (errMsg.includes("JSON"))
    return { help: "The AI gave an unexpected response. This happens occasionally — try again." };
  return null;
};

// ─── Slot update helpers ───────────────────────────────────────────────────

type SlotSetter = (
  updater: (prev: AnalysisSlot) => AnalysisSlot,
) => void;

// ─── Section component (memoized) ─────────────────────────────────────────

// ─── Page Component ────────────────────────────────────────────────────────

export default function Home() {
  const [state, setState] = useState<AnalysisState>({
    status: "idle",
  });  const [showSlowWarning, setShowSlowWarning] = useState(false);

  const mountedRef = useRef(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Helper: update the first slot
  const updateFirstSlot: SlotSetter = useCallback(
    (updater) => {
      setState((prev) => {
        const updated = updater(prev);
        return { ...prev, ...updated };
      });
    },
    [],
  );

  // Helper: update the second slot
  const updateSecondSlot: SlotSetter = useCallback(
    (updater) => {
      setState((prev) => {
        const current = prev.secondSlot || { status: "idle" as const };
        const updated = updater(current);
        return { ...prev, secondSlot: updated };
      });
    },
    [],
  );

  const handleFirstFileSelect = useCallback(
    (file: File) => {
      setShowSlowWarning(false);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setShowSlowWarning(true), 90000);
      runAnalysis(file, updateFirstSlot, mountedRef);
    },
    [updateFirstSlot],
  );

  const handleSecondFileSelect = useCallback(
    (file: File) => {
      runAnalysis(file, updateSecondSlot, mountedRef);
    },
    [updateSecondSlot],
  );

  const handleAddSecond = useCallback(() => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  }, []);

  const handleReset = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setShowSlowWarning(false);
    setState({ status: "idle" });
  }, []);

  const handleResetSecond = useCallback(() => {
    setState((prev) => ({ ...prev, secondSlot: undefined }));
  }, []);

  // ── Derived states ────────────────────────────────────────────────────

  const isInComparisonMode =
    state.secondSlot !== undefined &&
    (state.secondSlot.status !== "idle" ||
      state.status === "complete");

  const hasFirstResult =
    (state.status === "streaming" || state.status === "complete") &&
    state.result;

  const showUpload =
    state.status === "idle" ||
    state.status === "uploading" ||
    state.status === "parsing";

  const showLoading =
    state.status === "uploading" || state.status === "parsing";

  const errorHelp = state.status === "error" && state.error
    ? getErrorHelp(state.error)
    : null;

  return (
    <div className="flex min-h-screen flex-col" id="main-content">
      {/* Skip to content link */}
      <a
        href="#main-content"
        className="mono"
        style={{
          position: "absolute",
          left: "-9999px",
          top: "auto",
          width: "1px",
          height: "1px",
          overflow: "hidden",
        }}
        onFocus={(e) => {
          e.currentTarget.style.left = "16px";
          e.currentTarget.style.top = "16px";
          e.currentTarget.style.width = "auto";
          e.currentTarget.style.height = "auto";
          e.currentTarget.style.zIndex = "9999";
          e.currentTarget.style.background = "var(--amber)";
          e.currentTarget.style.color = "#000";
          e.currentTarget.style.padding = "8px 16px";
        }}
        onBlur={(e) => {
          e.currentTarget.style.left = "-9999px";
        }}
      >
        Skip to main content
      </a>

      {/* Screen reader live region */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {(state.status === "streaming" || state.status === "uploading" || state.status === "parsing") && "Analyzing your contract. Please wait."}
        {state.status === "complete" && state.result && `Analysis complete. Risk score: ${state.result.overallRiskScore} out of 10.`}
        {state.status === "error" && `Error: ${state.error}`}
      </div>

      <Header />

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8 sm:px-6">
        {/* ── COMPARISON MODE: Show both dashboards side by side ── */}
        {isInComparisonMode && (
          <CompareView
            firstSlot={state as AnalysisSlot}
            secondSlot={state.secondSlot || { status: "idle" }}
            onAddSecond={handleAddSecond}
            onReset={handleReset}
            onResetSecond={handleResetSecond}
          />
        )}

        {/* ── SINGLE MODE: Standard upload + results flow ── */}
        {!isInComparisonMode && (
          <>
            {/* Upload area */}
            {showUpload && (
              <div className="mb-8">
                <FileUpload
                  onFileSelect={handleFirstFileSelect}
                  disabled={state.status === "uploading" || state.status === "parsing"}
                />
              </div>
            )}

            {/* Loading */}
            {showLoading && (
              <LoadingState
                status={state.status === "uploading" ? "uploading" : "parsing"}
                fileName={state.fileName}
              />
            )}

            {/* Empty state */}
            {state.status === "idle" && <EmptyState />}

            {/* Slow warning */}
            {state.status === "streaming" && showSlowWarning && (
              <div
                className="mx-auto mt-4 max-w-2xl"
                style={{
                  padding: "12px",
                  background: "rgba(245,158,11,0.08)",
                  border: "1px solid rgba(245,158,11,0.2)",
                  borderRadius: "2px",
                }}
              >
                <span className="mono text-xs" style={{ color: "var(--amber)" }}>
                  ⏳ Still working... Local AI can be slow on first run or with large documents. This can take up to 3 minutes.
                </span>
              </div>
            )}

            {/* Error */}
            {state.status === "error" && (
              <div className="mx-auto max-w-2xl">
                <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900 dark:bg-red-950/20">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                    <svg
                      className="h-6 w-6 text-red-600 dark:text-red-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="mb-1 text-sm font-semibold text-red-800 dark:text-red-300">
                    Analysis Failed
                  </h3>
                  <p className="mb-4 text-sm text-red-600 dark:text-red-400">
                    {state.error}
                  </p>

                  {/* Context-aware error help */}
                  {errorHelp && (
                    <div className="mb-4 text-left">
                      <p className="text-xs text-red-500 dark:text-red-400 mb-2">
                        {errorHelp.help}
                      </p>
                      {errorHelp.code && (
                        <code className="block rounded bg-red-100 px-3 py-2 text-xs font-mono text-red-700 dark:bg-red-900/40 dark:text-red-300">
                          {errorHelp.code}
                        </code>
                      )}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                      onClick={handleReset}
                      aria-label="Try uploading again"
                      className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 w-full sm:w-auto"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Single analysis results */}
            {hasFirstResult && (
              <>
                <AnalysisDashboard
                  analysis={state.result!}
                  onReset={handleReset}
                  isStreaming={state.status === "streaming"}
                  clauseCount={state.clauseCount}
                />

                {/* Add comparison CTA */}
                {state.status === "complete" && (
                  <div className="mt-8">
                    <div className="rounded-xl border border-dashed border-amber-900/30 bg-amber-950/10 p-8 text-center">
                      <h3 className="mb-2 text-sm font-bold text-zinc-100">
                        Compare with Another Contract
                      </h3>
                      <p className="mb-4 text-xs text-zinc-500">
                        Upload a second contract to see a side-by-side comparison
                        of risk scores, clause distributions, and key differences.
                      </p>
                      <div className="mx-auto max-w-md">
                        <FileUpload
                          onFileSelect={handleSecondFileSelect}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-4">
        <p className="text-center text-xs text-zinc-600">
          Contract.Review — Powered by OpenRouter AI. Your contracts are processed securely.
        </p>
      </footer>
    </div>
  );
}
