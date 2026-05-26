export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface ClauseAnalysis {
  title: string;
  clauseText: string;
  riskLevel: RiskLevel;
  explanation: string;
  recommendation: string;
}

export interface ContractAnalysis {
  overallRiskScore: number; // 1-10
  summary: string;
  keyFindings: string[];
  parties: string[];
  contractType: string;
  effectiveDate: string;
  clauses: ClauseAnalysis[];
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
