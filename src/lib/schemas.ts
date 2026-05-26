import { z } from "zod";

export const RiskLevelSchema = z.enum(["low", "medium", "high", "critical"]);

export const ClauseAnalysisSchema = z.object({
  title: z.string().min(1).max(200),
  clauseText: z.string().min(1).max(5000),
  riskLevel: RiskLevelSchema,
  explanation: z.string().min(1).max(2000),
  recommendation: z.string().min(1).max(2000),
});

export const ContractAnalysisSchema = z.object({
  overallRiskScore: z.number().int().min(0).max(10),
  summary: z.string().min(1).max(5000),
  keyFindings: z.array(z.string().min(1).max(500)).max(20),
  parties: z.array(z.string().min(1).max(200)).max(20),
  contractType: z.string().min(1).max(100),
  effectiveDate: z.string().min(1).max(100),
  clauses: z.array(ClauseAnalysisSchema).max(50),
});

export type ContractAnalysis = z.infer<typeof ContractAnalysisSchema>;
export type ClauseAnalysis = z.infer<typeof ClauseAnalysisSchema>;
