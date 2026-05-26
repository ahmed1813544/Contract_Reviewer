# Contract.Review

> Free, open-source AI contract analysis. Drop a PDF, get instant risk scoring, flagged clauses, key dates, and plain-English summaries. No account. No cloud. No cost.

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![AI: OpenRouter](https://img.shields.io/badge/AI-OpenRouter-blue)

---

## Screenshot

_Add a screenshot here after running the app_

---

## Features

- ✅ **Zero friction** — drop a PDF, get results. No signup, no login, no forms
- ✅ **Powered by OpenRouter** — access to multiple AI models via [OpenRouter](https://openrouter.ai)
- ✅ **No data leaks** — your contracts are processed securely
- ✅ **Risk scoring** — 1–10 score with LOW/MEDIUM/HIGH/CRITICAL levels
- ✅ **Clause detection** — flags risky, non-standard, or missing clauses
- ✅ **Key dates** — extracts deadlines, renewals, and obligations
- ✅ **Recommendations** — specific, actionable suggestions
- ✅ **Export** — copy or download the full report as .txt

---

## Prerequisites

You need these installed before running the app:

### 1. Node.js 18+
Download from [nodejs.org](https://nodejs.org)

### 2. OpenRouter API Key
Get a free API key from [openrouter.ai/keys](https://openrouter.ai/keys)

---

## Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/yourusername/contract-review.git
cd contract-review

# 2. Install dependencies
npm install

# 3. Copy environment file
cp .env.example .env.local

# 4. Add your OpenRouter API key to .env.local
# Edit .env.local and set OPENROUTER_API_KEY=your_key_here

# 5. Run the app
npm run dev

# 6. Open http://localhost:3000
```

---

## Environment Variables

Create `.env.local` from `.env.example`:

| Variable | Default | Description |
|---|---|---|
| `OPENROUTER_API_KEY` | Required | Your OpenRouter API key from https://openrouter.ai/keys |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | Your deployment URL (for SEO) |

---

## Alternative AI Models

OpenRouter supports many models. The app uses `openrouter/owl-alpha` by default. You can change it in `src/lib/ollama.ts`:

| Model | Speed | Accuracy | Cost |
|---|---|---|---|
| `openrouter/owl-alpha` | Fast | Good | Low |
| `openai/gpt-4-turbo` | Medium | Excellent | Higher |
| `anthropic/claude-3-opus` | Medium | Excellent | Higher |

To use a different model, edit `src/lib/ollama.ts` and change the `model` parameter in both functions.

---

## Deployment

### Vercel (Recommended)
Works on Vercel with environment variables configured.

1. Push your code to GitHub
2. Connect your repo to Vercel
3. Add `OPENROUTER_API_KEY` to Environment Variables in Vercel settings
4. Deploy

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

### Self-hosted
Works on any Node.js server. Just set the `OPENROUTER_API_KEY` environment variable.

---

## Tech Stack

- **[Next.js 16](https://nextjs.org)** — Framework
- **[TypeScript](https://typescriptlang.org)** — Type safety
- **[Tailwind CSS](https://tailwindcss.com)** — Styling
- **[OpenRouter](https://openrouter.ai)** — AI inference
- **[pdf-parse](https://www.npmjs.com/package/pdf-parse)** — PDF text extraction
- **[Zod](https://zod.dev)** — Runtime validation
- **[Lucide React](https://lucide.dev)** — Icons
- **IBM Plex Mono/Sans** — Typography

---

## Troubleshooting

**"Server configuration error: OPENROUTER_API_KEY is not set"**
- Add `OPENROUTER_API_KEY` to your `.env.local` file
- For production (Vercel), add it to Environment Variables in project settings

**"Cannot connect to OpenRouter"**
- Your API key is invalid or expired
- Check your API key at https://openrouter.ai/keys
- Verify you have credits available

**"401 Unauthorized"**
- Your API key is incorrect
- Generate a new key at https://openrouter.ai/keys
- Update it in your environment variables

**"Could not extract text"**
Your PDF may be a scanned image. Use a PDF with selectable text. Try copying text from it in your PDF viewer first.

**Analysis is slow**
Normal for first run — the model loads into memory. Subsequent analyses are faster.

**JSON parse error**
The AI occasionally returns malformed JSON. Hit "Analyze Another" and try again.

---

## Contributing

PRs welcome. Please open an issue first to discuss major changes.

---

## License

MIT — free to use, modify, and distribute.

---

## Disclaimer

This tool is for informational purposes only. It is not legal advice. Always consult a qualified lawyer for important contracts.
