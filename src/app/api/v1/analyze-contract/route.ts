import { NextRequest } from "next/server";
import { parsePDF } from "@/lib/pdf";
import { buildAnalysisPrompt } from "@/lib/prompts";
import { analyzeWithOpenRouterStream } from "@/lib/ollama";
import { extractJsonFromText } from "@/lib/stream-json";
import { ContractAnalysisSchema } from "@/lib/schemas";
import { sanitizeContractText } from "@/lib/sanitize";
import logger from "@/lib/logger";

function send(controller: ReadableStreamDefaultController, data: unknown) {
  controller.enqueue(
    new TextEncoder().encode(JSON.stringify(data) + "\n")
  );
}

export async function POST(request: NextRequest) {
  let cancelled = false;

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
          send(controller, { type: "error", message: "No file provided" });
          controller.close();
          return;
        }

        // Check request body size before processing
        const contentLength = request.headers.get("content-length");
        if (contentLength && parseInt(contentLength) > 11 * 1024 * 1024) {
          send(controller, { type: "error", message: "Request too large" });
          controller.close();
          return;
        }

        // Validate MIME type
        if (file.type !== "application/pdf") {
          send(controller, { type: "error", message: "Only PDF files are accepted" });
          controller.close();
          return;
        }

        // Validate file extension (can't be spoofed as easily as MIME type)
        if (!file.name.toLowerCase().endsWith(".pdf")) {
          send(controller, { type: "error", message: "File must have a .pdf extension" });
          controller.close();
          return;
        }

        if (file.size > 10 * 1024 * 1024) {
          send(controller, { type: "error", message: "File size exceeds 10MB limit" });
          controller.close();
          return;
        }

        // Parse PDF
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const text = await parsePDF(buffer);

        if (!text.trim()) {
          send(controller, {
            type: "error",
            message:
              "Could not extract any text from the PDF. The file may be scanned or image-based.",
          });
          controller.close();
          return;
        }

        // Check for minimum text content
        const wordCount = text.trim().split(/\s+/).length;
        if (wordCount < 20) {
          send(controller, {
            type: "error",
            message:
              "PDF appears to be empty or contains only images. Use a text-based PDF.",
          });
          controller.close();
          return;
        }

        // Sanitize contract text to prevent injection
        let sanitizedText: string;
        try {
          sanitizedText = sanitizeContractText(text);
        } catch (error) {
          send(controller, {
            type: "error",
            message: error instanceof Error ? error.message : "Failed to process contract text",
          });
          controller.close();
          return;
        }

        // Send meta event
        send(controller, {
          type: "meta",
          charCount: sanitizedText.length,
          wordCount,
        });

        logger.info('Contract analysis started', { fileName: file.name, wordCount });

        // Stream OpenRouter analysis
        const prompt = buildAnalysisPrompt(sanitizedText);
        const tokenStream = analyzeWithOpenRouterStream(prompt);
        let accumulatedTokens = "";

        for await (const token of tokenStream) {
          if (cancelled) break;
          accumulatedTokens += token;
          send(controller, { type: "chunk", text: token });
        }

        if (!cancelled) {
          // Parse the accumulated tokens through Zod for validation
          try {
            const jsonStr = extractJsonFromText(accumulatedTokens);
            if (jsonStr) {
              const analysisData = JSON.parse(jsonStr);
              const parseResult = ContractAnalysisSchema.safeParse(analysisData);

              if (!parseResult.success) {
                logger.warn('Zod validation failed', { error: parseResult.error.flatten() });
                // Recover with safe defaults using the actual API field names
                const partial = {
                  overallRiskScore: Math.min(10, Math.max(0, Number(analysisData.overallRiskScore) || 5)),
                  summary: String(analysisData.summary || "Analysis summary not available."),
                  contractType: String(analysisData.contractType || "Other"),
                  effectiveDate: String(analysisData.effectiveDate || "Not specified"),
                  parties: Array.isArray(analysisData.parties) ? analysisData.parties.slice(0, 10).map(String) : [],
                  keyFindings: Array.isArray(analysisData.keyFindings) ? analysisData.keyFindings.slice(0, 10).map(String) : [],
                  clauses: Array.isArray(analysisData.clauses) ? analysisData.clauses.slice(0, 30) : [],
                };
                send(controller, {
                  type: "zod-validation",
                  warning: "Partial analysis — AI response was incomplete",
                  analysis: partial,
                });
              }
            }
          } catch (error) {
            logger.debug('JSON parsing skipped (non-JSON response ok)', { hasAccumulatedTokens: accumulatedTokens.length > 0 });
          }
          send(controller, { type: "done" });
          logger.info('Contract analysis completed successfully');
        }
      } catch (error) {
        if (cancelled) return;

        const message =
          error instanceof Error
            ? error.message
            : "An unexpected error occurred";

        logger.error('Contract analysis error', { message, error: error instanceof Error ? error.stack : String(error) });

        if (!process.env.OPENROUTER_API_KEY) {
          send(controller, {
            type: "error",
            message:
              "Server configuration error: OPENROUTER_API_KEY is not set. Please contact the administrator.",
          });
        } else if (
          message.includes("401") ||
          message.includes("unauthorized") ||
          message.includes("unauthorised") ||
          message.includes("403") ||
          message.includes("429") ||
          message.includes("fetch failed") ||
          message.includes("ECONNREFUSED") ||
          message.includes("connect")
        ) {
          send(controller, {
            type: "error",
            message:
              "Cannot connect to OpenRouter. Check that your API key is valid and you have credits available. Model: openrouter/owl-alpha",
          });
        } else {
          send(controller, { type: "error", message });
        }
      } finally {
        try {
          controller.close();
        } catch {
          // Ignore if already closed
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

  // Allow client to signal cancellation
  request.signal.addEventListener("abort", () => {
    cancelled = true;
  });

  return response;
}
