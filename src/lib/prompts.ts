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
  "clauses": [
    {
      "title": "<clause title/type e.g. Indemnification, Limitation of Liability, etc.>",
      "clauseText": "<exact quote from the contract text for this clause>",
      "riskLevel": "<low|medium|high|critical>",
      "explanation": "<what this clause means in plain English>",
      "recommendation": "<actionable recommendation for the user>"
    }
  ]
}

Analyze at least 5-8 important clauses. Be thorough and accurate. If you cannot identify any clause text, provide your best analysis based on the content available.`;
}
