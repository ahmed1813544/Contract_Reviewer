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
        const { clauseText, clauseTitle } = body;

        if (!clauseText) {
          send(controller, { type: "error", message: "No clause text provided" });
          controller.close();
          return;
        }

        logger.info("Clause suggestion requested", { clauseTitle });

        const prompt = `You are an expert contract lawyer. The following clause has been flagged as risky:

CLAUSE TITLE: ${clauseTitle || "Unknown"}
CLAUSE TEXT: """
${clauseText.slice(0, 5000)}
"""

Rewrite this clause to be more balanced and fair for both parties. Then explain what you changed and why.

Return STRICT JSON only (no markdown, no code fences) in this exact format:
{
  "originalClause": "<the original clause text>",
  "suggestedClause": "<your rewritten, balanced version of the clause>",
  "explanation": "<clear explanation of what was changed and why, point by point>"
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
          logger.info("Clause suggestion completed");
        }
      } catch (error) {
        if (cancelled) return;
        const message =
          error instanceof Error ? error.message : "An unexpected error occurred";
        logger.error("Clause suggestion error", { message });
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
