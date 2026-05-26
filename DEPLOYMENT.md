# Deployment Guide

## Production Deployment (Vercel)

### Prerequisites
1. OpenRouter API key (get one at https://openrouter.ai/keys)
2. Vercel account (https://vercel.com)

### Steps to Fix Production

1. **Go to your Vercel project settings**
   - Visit https://vercel.com/dashboard
   - Select your `contract-reviewer` project
   - Go to Settings → Environment Variables

2. **Add the OPENROUTER_API_KEY**
   - Name: `OPENROUTER_API_KEY`
   - Value: Your OpenRouter API key (starts with `sk-or-v1-`)
   - Environments: Select `Production`, `Preview`, and `Development`
   - Click "Save"

3. **Redeploy the application**
   - Go to Deployments tab
   - Click the three dots on the latest deployment
   - Select "Redeploy"
   - Wait for the deployment to complete

4. **Test the application**
   - Visit https://contract-reviewer-pi.vercel.app
   - Upload a PDF contract
   - Verify the analysis works

### Troubleshooting

**Error: "Server configuration error: OPENROUTER_API_KEY is not set"**
- The environment variable is not set in Vercel
- Follow steps 1-2 above to add it

**Error: "Cannot connect to OpenRouter"**
- Your API key is invalid or expired
- Check your API key at https://openrouter.ai/keys
- Verify you have credits available
- Update the environment variable in Vercel

**Error: "401 Unauthorized"**
- Your API key is incorrect
- Generate a new key at https://openrouter.ai/keys
- Update it in Vercel environment variables

### Local Development

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Add your OpenRouter API key:
   ```
   OPENROUTER_API_KEY=sk-or-v1-your-key-here
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open http://localhost:3000
