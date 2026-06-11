import { NextRequest } from "next/server";
import { analyzeWithOpenRouterStream } from "@/lib/ollama";
import logger from "@/lib/logger";

function send(controller: ReadableStreamDefaultController, data: unknown) {
  controller.enqueue(new TextEncoder().encode(JSON.stringify(data) + "\n"));
}

export async function POST(request: NextRequest) {
  let cancelled = false;

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const body = await request.json();
        const { analysis } = body;

        if (!analysis) {
          send(controller, { type: "error", message: "No analysis data provided" });
          controller.close();
          return;
        }

        logger.info("Plain English rewrite requested");

        const prompt = `You are an expert at explaining legal documents in simple, everyday language. Here is a contract analysis:

CONTRACT SUMMARY: ${analysis.summary || "N/A"}
CONTRACT TYPE: ${analysis.contractType || "N/A"}
KEY FINDINGS: ${JSON.stringify(analysis.keyFindings || [])}

CLAUSES:
${(analysis.clauses || []).map((c: { title: string; explanation: string }, i: number) =>
  `${i + 1}. ${c.title}: ${c.explanation}`
).join("\n")}

Rewrite the ENTIRE analysis in plain, simple English that anyone can understand — no legal jargon. Each clause explanation MUST start with "In simple terms: ". The reading level should be appropriate for someone who has never read a legal document.

Return STRICT JSON only (no markdown, no code fences) in this exact format:
{
  "plainEnglishSummary": "<2-3 sentence summary in simple language>",
  "plainEnglishKeyFindings": ["<finding 1 in plain English>", "<finding 2 in plain English>", ...],
  "plainEnglishClauses": [
    {
      "title": "<clause title>",
      "plainEnglishExplanation": "<In simple terms: ... explanation>"
    }
  ]
}`;

        const tokenStream = analyzeWithOpenRouterStream(prompt);
        let accumulatedTokens = "";

        for await (const token of tokenStream) {
          if (cancelled) break;
          accumulatedTokens += token;
          send(controller, { type: "chunk", text: token });
        }

        if (!cancelled) {
          send(controller, { type: "done" });
          logger.info("Plain English rewrite completed");
        }
      } catch (error) {
        if (cancelled) return;
        const message =
          error instanceof Error ? error.message : "An unexpected error occurred";
        logger.error("Plain English rewrite error", { message });
        send(controller, { type: "error", message });
      } finally {
        try {
          controller.close();
        } catch {
          // Ignore
        }
      }
    },
  });

  const response = new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });

  request.signal.addEventListener("abort", () => {
    cancelled = true;
  });

  return response;
}
