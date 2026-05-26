# Contract.Review

> Free, open-source AI contract analysis. Drop a PDF, get instant risk scoring, flagged clauses, key dates, and plain-English summaries. No account. No cloud. No cost.

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![AI: Ollama](https://img.shields.io/badge/AI-Ollama-blue)

---

## Screenshot

_Add a screenshot here after running the app_

---

## Features

- ✅ **Zero friction** — drop a PDF, get results. No signup, no login, no forms
- ✅ **100% local AI** — powered by [Ollama](https://ollama.com) running on your machine
- ✅ **No data leaks** — your contracts never leave your computer
- ✅ **No API costs** — completely free, forever
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

### 2. Ollama
Download from [ollama.com](https://ollama.com) — available for macOS, Linux, Windows

### 3. Pull the AI model (one-time, ~2GB)
```bash
ollama pull llama3.2
```

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

# 4. Start Ollama in a separate terminal
ollama serve

# 5. Run the app
npm run dev

# 6. Open http://localhost:3000
```

---

## Environment Variables

Create `.env.local` from `.env.example`:

| Variable | Default | Description |
|---|---|---|
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama server URL |
| `OLLAMA_MODEL` | `llama3.2` | Model to use for analysis |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | Your deployment URL (for SEO) |

---

## Alternative AI Models

Any Ollama model works. Trade-off: larger = more accurate but slower.

| Model | Size | Speed | Accuracy |
|---|---|---|---|
| `llama3.2` ⭐ | 2GB | Fast | Good |
| `mistral` | 4GB | Medium | Better |
| `llama3.1` | 4.7GB | Slow | Best |
| `phi3` | 2.2GB | Fast | Good |

To use a different model:
```bash
ollama pull mistral
# Update .env.local: OLLAMA_MODEL=mistral
```

---

## Deployment

### Self-hosted (recommended for privacy)
Works on any Node.js server. Ollama must be running on the same machine or accessible via network.

### Vercel / Netlify
⚠️ **Note**: Ollama runs locally. For cloud deployment, you need Ollama accessible via a public URL or use a hosted LLM alternative.

For cloud deployments, update `OLLAMA_BASE_URL` in your environment variables to point to a remote Ollama instance.

---

## Tech Stack

- **[Next.js 14](https://nextjs.org)** — Framework
- **[TypeScript](https://typescriptlang.org)** — Type safety
- **[Tailwind CSS](https://tailwindcss.com)** — Styling
- **[Ollama](https://ollama.com)** — Local AI inference
- **[pdf-parse](https://www.npmjs.com/package/pdf-parse)** — PDF text extraction
- **[Zod](https://zod.dev)** — Runtime validation
- **[Lucide React](https://lucide.dev)** — Icons
- **IBM Plex Mono/Sans** — Typography

---

## Troubleshooting

**"Ollama is not running"**
```bash
ollama serve
```

**"Model not found"**
```bash
ollama pull llama3.2
```

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
