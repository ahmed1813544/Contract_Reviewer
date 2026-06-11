import { z } from "zod";

export const RiskLevelSchema = z.enum(["low", "medium", "high", "critical"]);

export const ClauseAnalysisSchema = z.object({
  title: z.string().min(1).max(200),
  clauseText: z.string().min(1).max(5000),
  riskLevel: RiskLevelSchema,
  explanation: z.string().min(1).max(2000),
  recommendation: z.string().min(1).max(2000),
  clauseScore: z.number().min(1).max(10).optional(),
  plainEnglishExplanation: z.string().max(2000).optional(),
});

export const MissingClauseSchema = z.object({
  clauseType: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  template: z.string().max(3000).optional(),
  importance: z.enum(["high", "medium", "low"]),
});

export const NegotiationTipSchema = z.object({
  clauseTitle: z.string().min(1).max(200),
  riskLevel: RiskLevelSchema,
  tip: z.string().min(1).max(1000),
  priority: z.number().int().min(1).max(10),
});

export const ContractAnalysisSchema = z.object({
  overallRiskScore: z.number().int().min(0).max(10),
  summary: z.string().min(1).max(5000),
  keyFindings: z.array(z.string().min(1).max(500)).max(20),
  parties: z.array(z.string().min(1).max(200)).max(20),
  contractType: z.string().min(1).max(100),
  effectiveDate: z.string().min(1).max(100),
  clauses: z.array(ClauseAnalysisSchema).max(50),
  jurisdiction: z.string().max(200).optional(),
  jurisdictionNotes: z.string().max(1000).optional(),
  missingClauses: z.array(MissingClauseSchema).max(20).optional(),
  negotiationTips: z.array(NegotiationTipSchema).max(30).optional(),
  plainEnglishSummary: z.string().max(5000).optional(),
});

export type ContractAnalysis = z.infer<typeof ContractAnalysisSchema>;
export type ClauseAnalysis = z.infer<typeof ClauseAnalysisSchema>;
export type MissingClause = z.infer<typeof MissingClauseSchema>;
export type NegotiationTip = z.infer<typeof NegotiationTipSchema>;
