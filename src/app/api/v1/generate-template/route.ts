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
        const { clauseType, contractContext } = body;

        if (!clauseType) {
          send(controller, { type: "error", message: "No clause type provided" });
          controller.close();
          return;
        }

        logger.info("Template generation requested", { clauseType });

        const prompt = `You are an expert contract lawyer. Generate a standard, fair boilerplate template for the following clause type:

CLAUSE TYPE: ${clauseType}
${contractContext ? `CONTRACT CONTEXT: """${contractContext.slice(0, 3000)}"""` : ""}

Provide a well-balanced, standard template clause that would be appropriate for a business contract. Make it fair to both parties.

Return STRICT JSON only (no markdown, no code fences) in this exact format:
{
  "template": "<the boilerplate template text for this clause>",
  "notes": "<brief notes on what this clause covers and any customization recommendations>"
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
          logger.info("Template generation completed");
        }
      } catch (error) {
        if (cancelled) return;
        const message =
          error instanceof Error ? error.message : "An unexpected error occurred";
        logger.error("Template generation error", { message });
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
