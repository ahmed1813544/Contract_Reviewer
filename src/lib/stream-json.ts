/**
 * Incremental JSON parser that extracts individual top-level key-value pairs
 * as they become complete in the streaming text. This enables true progressive
 * rendering — risk score, summary, and clauses appear one by one as the AI
 * generates them.
 *
 * Strategy: scan left-to-right, consuming complete key:value pairs. For each
 * successfully consumed pair, add it to the result object. Stop at the first
 * incomplete pair and return whatever we've accumulated so far.
 */

import type { ContractAnalysis, ClauseAnalysis, RiskLevel, MissingClause, NegotiationTip } from "@/types";

// ─── Public API ────────────────────────────────────────────────────────────

/**
 * Scan the accumulated streaming text left-to-right, extracting each
 * complete top-level key-value pair as it becomes available. Returns a
 * partial `ContractAnalysis` built from whatever keys are complete, or
 * `null` if nothing parseable has arrived yet (e.g. only the opening `{`).
 *
 * The `previousResult` is used to preserve fields from earlier parses that
 * aren't overwritten by the current scan — this makes the UI additive.
 */
export function streamParse(
  text: string,
  previousResult: ContractAnalysis | null
): ContractAnalysis | null {
  const start = text.indexOf("{");
  if (start === -1) return null;

  let pos = start + 1; // past the opening {
  const pairs: Record<string, unknown> = {};

  while (pos < text.length) {
    // ── skip whitespace & commas ──────────────────────────────────────
    pos = skipSpace(text, pos);
    if (pos >= text.length || text[pos] === "}") break;
    if (text[pos] === ",") {
      pos++;
      pos = skipSpace(text, pos);
      if (pos >= text.length || text[pos] === "}") break;
    }

    // ── read key ──────────────────────────────────────────────────────
    const key = readString(text, pos);
    if (key === null) break;
    pos = key.nextPos;

    // ── colon ─────────────────────────────────────────────────────────
    pos = skipSpace(text, pos);
    if (pos >= text.length || text[pos] !== ":") break;
    pos++;
    pos = skipSpace(text, pos);
    if (pos >= text.length) break;

    // ── read value ────────────────────────────────────────────────────
    const value = readValue(text, pos);
    if (value === null) break;
    pairs[key.value] = value.value;
    pos = value.nextPos;
  }

  if (Object.keys(pairs).length === 0) return null;

  return sanitizePartial(pairs, previousResult);
}

// ─── Value readers ────────────────────────────────────────────────────────

type ReadResult<T = unknown> = { value: T; nextPos: number } | null;

function readString(text: string, pos: number): ReadResult<string> {
  if (pos >= text.length || text[pos] !== '"') return null;
  pos++; // skip opening "
  let value = "";
  while (pos < text.length) {
    if (text[pos] === "\\") {
      pos++;
      if (pos < text.length) {
        value += text[pos];
        pos++;
      }
      continue;
    }
    if (text[pos] === '"') {
      pos++; // skip closing "
      return { value, nextPos: pos };
    }
    value += text[pos];
    pos++;
  }
  return null; // incomplete
}

function readNumber(text: string, pos: number): ReadResult<number> {
  const m = text.slice(pos).match(/^-?\d+(\.\d+)?([eE][+-]?\d+)?/);
  if (!m) return null;
  return { value: parseFloat(m[0]), nextPos: pos + m[0].length };
}

function readKeyword(text: string, pos: number): ReadResult<boolean | null> {
  if (text.startsWith("true", pos)) return { value: true, nextPos: pos + 4 };
  if (text.startsWith("false", pos)) return { value: false, nextPos: pos + 5 };
  if (text.startsWith("null", pos)) return { value: null, nextPos: pos + 4 };
  return null;
}

/**
 * Read any JSON value: string, number, boolean, null, array, or object.
 */
function readValue(text: string, pos: number): ReadResult {
  pos = skipSpace(text, pos);
  if (pos >= text.length) return null;

  const ch = text[pos];
  if (ch === '"') return readString(text, pos);
  if (ch === "-" || (ch >= "0" && ch <= "9")) return readNumber(text, pos);
  if (ch === "t" || ch === "f" || ch === "n") return readKeyword(text, pos);
  if (ch === "[") return readArray(text, pos);
  if (ch === "{") return readObject(text, pos);
  return null;
}

/**
 * Read a JSON array `[...]`, extracting whatever complete elements exist.
 * For incomplete arrays, returns only the complete elements found so far.
 */
function readArray(text: string, pos: number): ReadResult {
  if (pos >= text.length || text[pos] !== "[") return null;
  pos++; // skip [
  const elements: unknown[] = [];

  while (pos < text.length) {
    pos = skipSpace(text, pos);
    if (pos >= text.length) return { value: elements, nextPos: pos };
    if (text[pos] === "]") return { value: elements, nextPos: pos + 1 };
    if (text[pos] === ",") {
      pos++;
      continue;
    }

    const elem = readValue(text, pos);
    if (elem === null) {
      // Element is incomplete — return what we have so far
      return { value: elements, nextPos: pos };
    }
    elements.push(elem.value);
    pos = elem.nextPos;
    pos = skipSpace(text, pos);
    if (pos >= text.length || text[pos] === "]") {
      continue;
    }
  }

  return { value: elements, nextPos: pos };
}

/**
 * Read a JSON object `{...}` using JSON.parse on the substring once a
 * balanced `}` is found. Returns null if the object is incomplete.
 */
function readObject(text: string, pos: number): ReadResult {
  if (pos >= text.length || text[pos] !== "{") return null;
  let depth = 1;
  let end = pos + 1;
  let inStr = false;
  let esc = false;

  while (end < text.length) {
    if (esc) {
      esc = false;
      end++;
      continue;
    }
    if (text[end] === "\\" && inStr) {
      esc = true;
      end++;
      continue;
    }
    if (text[end] === '"') {
      inStr = !inStr;
      end++;
      continue;
    }
    if (!inStr) {
      if (text[end] === "{") depth++;
      if (text[end] === "}") depth--;
      if (depth === 0) {
        try {
          const parsed = JSON.parse(text.slice(pos, end + 1));
          return { value: parsed, nextPos: end + 1 };
        } catch {
          return null;
        }
      }
    }
    end++;
  }
  return null; // incomplete
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function skipSpace(text: string, pos: number): number {
  while (pos < text.length && (text[pos] === " " || text[pos] === "\n" || text[pos] === "\r" || text[pos] === "\t")) {
    pos++;
  }
  return pos;
}

// ─── Sanitize ──────────────────────────────────────────────────────────────

/**
 * Build a ContractAnalysis from whatever top-level keys were extracted.
 * Preserves fields from `previousResult` that aren't overwritten by new keys,
 * so the UI state is additive rather than replacing.
 */
function sanitizePartial(
  raw: Record<string, unknown>,
  previous: ContractAnalysis | null
): ContractAnalysis {
  const fallback = previous || ({} as ContractAnalysis);

  const overallRiskScore =
    typeof raw.overallRiskScore === "number"
      ? Math.min(Math.max(raw.overallRiskScore, 0), 10)
      : fallback.overallRiskScore || 0;

  const summary =
    typeof raw.summary === "string" && raw.summary.length > 0
      ? raw.summary
      : fallback.summary || "";

  const keyFindings = Array.isArray(raw.keyFindings)
    ? raw.keyFindings.filter((f): f is string => typeof f === "string")
    : fallback.keyFindings || [];

  const parties = Array.isArray(raw.parties)
    ? raw.parties.filter((p): p is string => typeof p === "string")
    : fallback.parties || [];

  const contractType =
    typeof raw.contractType === "string" && raw.contractType.length > 0
      ? raw.contractType
      : fallback.contractType || "";

  const effectiveDate =
    typeof raw.effectiveDate === "string" && raw.effectiveDate.length > 0
      ? raw.effectiveDate
      : fallback.effectiveDate || "";

  // Feature 4: Jurisdiction
  const jurisdiction =
    typeof raw.jurisdiction === "string" && raw.jurisdiction.length > 0
      ? raw.jurisdiction
      : fallback.jurisdiction || undefined;

  const jurisdictionNotes =
    typeof raw.jurisdictionNotes === "string"
      ? raw.jurisdictionNotes
      : fallback.jurisdictionNotes || undefined;

  // Feature 7: Missing clauses
  const missingClauses = Array.isArray(raw.missingClauses)
    ? (raw.missingClauses as Record<string, unknown>[]).map((mc) => ({
        clauseType: String(mc.clauseType || "Unknown"),
        description: String(mc.description || ""),
        template: mc.template ? String(mc.template) : undefined,
        importance: (["high", "medium", "low"].includes(String(mc.importance))
          ? mc.importance
          : "medium") as "high" | "medium" | "low",
      }))
    : fallback.missingClauses || undefined;

  // Feature 3: Negotiation tips
  const negotiationTips = Array.isArray(raw.negotiationTips)
    ? (raw.negotiationTips as Record<string, unknown>[]).map((nt) => ({
        clauseTitle: String(nt.clauseTitle || "Unknown"),
        riskLevel: (["low", "medium", "high", "critical"].includes(String(nt.riskLevel))
          ? nt.riskLevel
          : "medium") as RiskLevel,
        tip: String(nt.tip || ""),
        priority: typeof nt.priority === "number" ? nt.priority : 5,
      }))
    : fallback.negotiationTips || undefined;

  // Feature 8: Plain English summary
  const plainEnglishSummary =
    typeof raw.plainEnglishSummary === "string"
      ? raw.plainEnglishSummary
      : fallback.plainEnglishSummary || undefined;

  // Merge clauses: new ones override old ones (by index), new ones beyond
  // the old length are appended.
  const newClauses = (Array.isArray(raw.clauses) ? raw.clauses : []) as Record<string, unknown>[];
  const oldClauses = fallback.clauses || [];

  const mergedClauses: ClauseAnalysis[] = newClauses.map((c, i) => ({
    title: (c.title as string) || oldClauses[i]?.title || "Unnamed Clause",
    clauseText: (c.clauseText as string) || oldClauses[i]?.clauseText || "",
    riskLevel: (c.riskLevel as RiskLevel) || oldClauses[i]?.riskLevel || "medium",
    explanation: (c.explanation as string) || oldClauses[i]?.explanation || "",
    recommendation: (c.recommendation as string) || oldClauses[i]?.recommendation || "",
    clauseScore: typeof c.clauseScore === "number" ? c.clauseScore : oldClauses[i]?.clauseScore,
    plainEnglishExplanation: (c.plainEnglishExplanation as string) || oldClauses[i]?.plainEnglishExplanation,
  }));

  // If new clauses are fewer than old (e.g. because the array is still filling),
  // append the old trailing clauses so the UI doesn't lose them
  while (mergedClauses.length < oldClauses.length) {
    mergedClauses.push(oldClauses[mergedClauses.length]);
  }

  return {
    overallRiskScore,
    summary,
    keyFindings,
    parties,
    contractType,
    effectiveDate,
    clauses: mergedClauses,
    jurisdiction,
    jurisdictionNotes,
    missingClauses,
    negotiationTips,
    plainEnglishSummary,
  };
}

/**
 * Final sanitize for the complete analysis — stricter defaults since
 * we know the response is done.
 */
export function sanitizeAnalysis(raw: Record<string, unknown>): ContractAnalysis {
  const clauses = (Array.isArray(raw.clauses) ? raw.clauses : []) as Record<string, unknown>[];
  return {
    overallRiskScore: Math.min(Math.max((raw.overallRiskScore as number) || 0, 0), 10),
    summary: (raw.summary as string) || "No summary provided.",
    keyFindings: (Array.isArray(raw.keyFindings) ? raw.keyFindings : []) as string[],
    parties: (Array.isArray(raw.parties) ? raw.parties : []) as string[],
    contractType: (raw.contractType as string) || "Unknown",
    effectiveDate: (raw.effectiveDate as string) || "Not specified",
    clauses: clauses.map((c) => ({
      title: (c.title as string) || "Unnamed Clause",
      clauseText: (c.clauseText as string) || "No text extracted",
      riskLevel: (c.riskLevel as RiskLevel) || "medium",
      explanation: (c.explanation as string) || "No explanation provided.",
      recommendation: (c.recommendation as string) || "No recommendation provided.",
      clauseScore: typeof c.clauseScore === "number" ? c.clauseScore : undefined,
      plainEnglishExplanation: (c.plainEnglishExplanation as string) || undefined,
    })),
    jurisdiction: (raw.jurisdiction as string) || undefined,
    jurisdictionNotes: (raw.jurisdictionNotes as string) || undefined,
    missingClauses: Array.isArray(raw.missingClauses)
      ? (raw.missingClauses as Record<string, unknown>[]).map((mc) => ({
          clauseType: String(mc.clauseType || "Unknown"),
          description: String(mc.description || ""),
          template: mc.template ? String(mc.template) : undefined,
          importance: (["high", "medium", "low"].includes(String(mc.importance))
            ? mc.importance
            : "medium") as "high" | "medium" | "low",
        }))
      : undefined,
    negotiationTips: Array.isArray(raw.negotiationTips)
      ? (raw.negotiationTips as Record<string, unknown>[]).map((nt) => ({
          clauseTitle: String(nt.clauseTitle || "Unknown"),
          riskLevel: (["low", "medium", "high", "critical"].includes(String(nt.riskLevel))
            ? nt.riskLevel
            : "medium") as RiskLevel,
          tip: String(nt.tip || ""),
          priority: typeof nt.priority === "number" ? nt.priority : 5,
        }))
      : undefined,
    plainEnglishSummary: (raw.plainEnglishSummary as string) || undefined,
  };
}

/**
 * Extract JSON from text using regex (robust against markdown-wrapping
 * or trailing content).
 */
export function extractJsonFromText(text: string): string | null {
  const match = text.match(/\{[\s\S]*\}/);
  return match ? match[0] : null;
}
