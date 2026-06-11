export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface ClauseAnalysis {
  title: string;
  clauseText: string;
  riskLevel: RiskLevel;
  explanation: string;
  recommendation: string;
  /** Clause-level score 1-10 (Feature 9) */
  clauseScore?: number;
  /** Plain English explanation (Feature 8) */
  plainEnglishExplanation?: string;
}

export interface ContractAnalysis {
  overallRiskScore: number; // 1-10
  summary: string;
  keyFindings: string[];
  parties: string[];
  contractType: string;
  effectiveDate: string;
  clauses: ClauseAnalysis[];
  /** Jurisdiction / governing law (Feature 4) */
  jurisdiction?: string;
  /** Jurisdiction-specific risk notes (Feature 4) */
  jurisdictionNotes?: string;
  /** Missing clauses detected (Feature 7) */
  missingClauses?: MissingClause[];
  /** Negotiation tips for high/critical clauses (Feature 3) */
  negotiationTips?: NegotiationTip[];
  /** Plain English summary of the whole contract (Feature 8) */
  plainEnglishSummary?: string;
}

export interface MissingClause {
  clauseType: string;
  description: string;
  template?: string;
  importance: "high" | "medium" | "low";
}

export interface NegotiationTip {
  clauseTitle: string;
  riskLevel: RiskLevel;
  tip: string;
  priority: number;
}

export interface ClauseSuggestion {
  originalClause: string;
  suggestedClause: string;
  explanation: string;
  changes: DiffChange[];
}

export interface DiffChange {
  type: "added" | "removed" | "unchanged";
  value: string;
}

export type AnalysisStatus =
  | "idle"
  | "uploading"
  | "parsing"
  | "streaming"
  | "complete"
  | "error";

/** State for one analysis slot (either the first or second contract) */
export interface AnalysisSlot {
  status: AnalysisStatus;
  error?: string;
  fileName?: string;
  result?: ContractAnalysis;
  clauseCount?: number;
}

export interface AnalysisState extends AnalysisSlot {
  /** Optional second slot for contract comparison */
  secondSlot?: AnalysisSlot;
}

/** Version history entry (Feature 6) */
export interface HistoryEntry {
  id: string;
  fileName: string;
  date: string;
  result: ContractAnalysis;
}
