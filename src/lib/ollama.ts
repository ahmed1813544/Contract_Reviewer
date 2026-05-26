import OpenAI from "openai";

if (!process.env.OPENROUTER_API_KEY) {
  throw new Error(
    "OPENROUTER_API_KEY environment variable is not set. " +
    "Please set it in your .env.local or production environment."
  );
}

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "https://contractreviewer.local",
    "X-OpenRouter-Title": "ContractReviewer",
  },
});

export async function analyzeWithOpenRouter(prompt: string): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: "openrouter/owl-alpha",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.1,
    max_tokens: 4096,
  });

  return completion.choices[0]?.message?.content || "";
}

export async function* analyzeWithOpenRouterStream(
  prompt: string
): AsyncGenerator<string> {
  const stream = await openai.chat.completions.create({
    model: "openrouter/owl-alpha",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.1,
    max_tokens: 4096,
    stream: true,
  });

  for await (const part of stream) {
    const content = part.choices[0]?.delta?.content || "";
    if (content) yield content;
  }
}
