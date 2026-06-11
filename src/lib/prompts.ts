export function buildAnalysisPrompt(contractText: string): string {
  return `You are an expert contract lawyer and legal analyst. Analyze the following contract and provide a detailed JSON analysis.

CONTRACT TEXT:
"""
${contractText.slice(0, 15000)}
"""

Return STRICT JSON only (no markdown, no code fences, no extra text) in this exact format:
{
  "overallRiskScore": <number 1-10, where 10 is highest risk>,
  "summary": "<2-3 sentence summary of the contract>",
  "keyFindings": ["<finding 1>", "<finding 2>", "<finding 3>", "<finding 4>", "<finding 5>"],
  "parties": ["<party 1 name>", "<party 2 name>"],
  "contractType": "<type of contract e.g. Service Agreement, NDA, Employment, etc.>",
  "effectiveDate": "<effective date if found, otherwise 'Not specified'>",
  "jurisdiction": "<governing law/jurisdiction if found, e.g. 'State of California', 'England and Wales', or 'Not specified'>",
  "jurisdictionNotes": "<any jurisdiction-specific risk notes, e.g. 'California law — note CCPA implications for data handling clauses'. If jurisdiction is 'Not specified', note the risks of having no governing law clause.>",
  "missingClauses": [
    {
      "clauseType": "<type of missing clause, e.g. 'Dispute Resolution', 'Force Majeure', 'Limitation of Liability', 'Confidentiality/NDA', 'Intellectual Property', 'Governing Law', 'Termination for Cause'>",
      "description": "<brief explanation of why this clause is important and what it should contain>",
      "importance": "<high|medium|low>"
    }
  ],
  "negotiationTips": [
    {
      "clauseTitle": "<title of the clause this tip relates to>",
      "riskLevel": "<risk level of the related clause>",
      "tip": "<specific actionable negotiation tip, e.g. 'Request removal of Section 5.2 — one-sided termination clause'>",
      "priority": <number 1-10, where 10 is most urgent>
    }
  ],
  "plainEnglishSummary": "<2-3 sentence summary written in simple, jargon-free language that anyone can understand>",
  "clauses": [
    {
      "title": "<clause title/type e.g. Indemnification, Limitation of Liability, etc.>",
      "clauseText": "<exact quote from the contract text for this clause>",
      "riskLevel": "<low|medium|high|critical>",
      "explanation": "<what this clause means in legal terms>",
      "plainEnglishExplanation": "<what this clause means starting with 'In simple terms: ...' written for someone with no legal background>",
      "clauseScore": <number 1-10, where 10 is best/fairest for the signing party>,
      "recommendation": "<actionable recommendation for the user>"
    }
  ]
}

IMPORTANT RULES:
- clauseScore: Rate each clause 1-10 where 10 is most fair/balanced for the signing party and 1 is extremely one-sided/risky
- missingClauses: Check for ALL 7 common clauses: Dispute Resolution/Arbitration, Limitation of Liability, Force Majeure, Confidentiality/NDA, Intellectual Property Ownership, Governing Law, Termination for Cause. Only include ones that are genuinely missing.
- negotiationTips: Generate at least 1 tip for each high/critical risk clause. Be specific and actionable.
- plainEnglishExplanation: Each clause explanation MUST start with "In simple terms: "
- plainEnglishSummary: Write as if explaining to someone who has never read a legal document

Analyze at least 5-8 important clauses. Be thorough and accurate. If you cannot identify any clause text, provide your best analysis based on the content available.`;
}
