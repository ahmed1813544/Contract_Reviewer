# Production-Ready Implementation Guide

This document outlines all the production-ready improvements made to the contract-reviewer application.

## 📋 What's Been Added

### 1. **Comprehensive Testing** ✅
- **Test Framework**: Jest with TypeScript support
- **Test Coverage**: Critical paths (input sanitization, rate limiting, logging)
- **Commands**:
  - `npm run test` — Run all tests
  - `npm run test:watch` — Watch mode for development
  - `npm run test:coverage` — Generate coverage report

**Test Files**:
- `src/lib/__tests__/sanitize.test.ts` — Tests for prompt/contract sanitization
- `src/lib/__tests__/rate-limit.test.ts` — Tests for rate limiting logic
- `src/lib/__tests__/logger.test.ts` — Tests for logging

**Current Status**: ✅ 14 tests passing

---

### 2. **Structured Logging** ✅
- **Location**: `src/lib/logger.ts`
- **Features**:
  - Structured JSON logging for production
  - Timestamp and service metadata included
  - Works on both server and edge runtimes
  - Debug logging for development mode

**Usage**:
```typescript
import logger from '@/lib/logger';

logger.info('User uploaded contract', { fileName: 'contract.pdf', wordCount: 2500 });
logger.warn('Rate limit approaching', { ip: '192.168.1.1', remaining: 1 });
logger.error('API error', { code: 401, message: 'Unauthorized' });
logger.debug('Processing started', { step: 'pdf_parsing' });
```

---

### 3. **Rate Limiting** ✅
- **Location**: `src/lib/rate-limit.ts`
- **Default Config**: 10 requests per hour per IP
- **Features**:
  - IP-based rate limiting
  - In-memory store (resets on server restart)
  - Standard rate limit headers
  - Configurable window and limits

**Rate Limit Headers**:
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 5
X-RateLimit-Reset: 1717413600
```

**Modify Limits**:
```typescript
// In src/lib/rate-limit.ts
export const RATE_LIMIT = {
  requests: 10,      // Number of requests
  window: 60 * 60 * 1000, // 1 hour in milliseconds
};
```

---

### 4. **Rate Limiting Middleware** ✅
- **Location**: `src/middleware.ts`
- **Features**:
  - Applied to all `/api/*` routes
  - Returns 429 (Too Many Requests) when limit exceeded
  - Logs rate limit violations
  - Adds headers to all API responses

---

### 5. **Input Sanitization** ✅
- **Location**: `src/lib/sanitize.ts`
- **Purpose**: Prevent prompt injection attacks
- **Functions**:
  - `sanitizeContractText()` — Removes injection patterns from contracts
  - `sanitizePrompt()` — Escapes dangerous characters in prompts

**Injection Patterns Blocked**:
- "ignore previous instructions"
- "disregard the above"
- "system prompt"
- "you are now"
- "act as if"
- "pretend to be"

---

### 6. **API Versioning** ✅
- **Legacy Endpoint**: `/api/analyze-contract`
  - Now redirects to v1 endpoint
  - Logs deprecation warnings
  - Maintained for backward compatibility

- **V1 Endpoint**: `/api/v1/analyze-contract`
  - New primary endpoint
  - Identical functionality to legacy endpoint
  - Recommended for new integrations

---

### 7. **Health Check Endpoint** ✅
- **Endpoint**: `GET /api/health`
- **Response**:
```json
{
  "status": "healthy",
  "timestamp": "2026-06-03T12:00:00.000Z",
  "version": "1.0.0",
  "checks": {
    "api_key_configured": true
  }
}
```

**Use Cases**:
- Uptime monitoring (Pingdom, UptimeRobot, DataDog)
- Load balancer health checks
- Kubernetes liveness/readiness probes

---

### 8. **Enhanced Security Headers** ✅
- **Location**: `next.config.js`
- **Improvements**:
  - X-Frame-Options: DENY (was SAMEORIGIN)
  - Added Strict-Transport-Security (HSTS)
  - Improved CSP with explicit OpenRouter origin
  - Added base-uri and form-action restrictions

**Headers Applied**:
```
X-DNS-Prefetch-Control: on
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: [strict policy with OpenRouter allowlist]
```

---

## 🚀 Deployment Checklist

### Before Going to Production:

- [ ] Set `OPENROUTER_API_KEY` environment variable
- [ ] Run `npm run test` — ensure all tests pass
- [ ] Run `npm run build` — verify build succeeds
- [ ] Test `/api/health` endpoint returns 200
- [ ] Test `/api/v1/analyze-contract` with sample PDF
- [ ] Verify rate limit headers in response
- [ ] Check logs for structured logging output
- [ ] Monitor first requests for any errors

### For Vercel Deployment:

1. Go to Vercel Dashboard → Project → Settings
2. Add Environment Variables:
   ```
   OPENROUTER_API_KEY=sk-or-v1-...
   NODE_ENV=production
   ```
3. Deploy the application
4. Test production endpoint

### For Self-Hosted:

1. Install dependencies: `npm install --production`
2. Build: `npm run build`
3. Set environment variables
4. Start: `npm run start`
5. Configure reverse proxy (nginx) with these settings:
   - Pass `X-Forwarded-For` header
   - Pass `X-Real-IP` header
   - Enable gzip compression

---

## 📊 Monitoring & Observability

### Structured Logging
All logs include:
- ISO 8601 timestamps
- Log level (INFO, WARN, ERROR, DEBUG)
- Service name
- Custom metadata/context

### Rate Limiting Monitoring
Track these metrics:
- `X-RateLimit-Remaining` — requests left in current window
- `X-RateLimit-Reset` — Unix timestamp when limit resets
- Repeat requests from same IP → possible abuse

### Health Checks
Monitor:
- `/api/health` should return 200 when healthy
- Response time should be < 100ms
- Check `api_key_configured` field

### Logging Integration
Aggregate logs from:
- API request/response times
- Rate limit violations
- Contract analysis errors
- OpenRouter API failures

---

## 🔧 Configuration

### Adjust Rate Limits
Edit `src/lib/rate-limit.ts`:
```typescript
export const RATE_LIMIT = {
  requests: 20,           // Increase to 20 requests
  window: 60 * 60 * 1000, // Per 1 hour
};
```

### Change Injection Patterns
Edit `src/lib/sanitize.ts` to add more blocked patterns:
```typescript
const injectionPatterns = [
  /your-new-pattern/gi,
  // ... existing patterns
];
```

### Modify CSP Headers
Edit `next.config.js` to adjust Content-Security-Policy

---

## 🧪 Testing Commands

```bash
# Run all tests
npm run test

# Run tests in watch mode (auto-rerun on file changes)
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run specific test file
npm run test -- sanitize.test.ts

# Run tests matching pattern
npm run test -- --testNamePattern="should remove"
```

---

## 📈 Performance Metrics

### Recommended Targets:
- API response time: < 30 seconds (contract analysis)
- Health check: < 100ms
- Rate limit headers: included in every response
- Logging overhead: < 1ms per log entry

### Monitor:
```bash
# In production logs, look for:
"Contract analysis completed successfully"  # Success metric
"Rate limit exceeded"                       # Abuse detection
"Zod validation failed"                     # Data quality issues
"Cannot connect to OpenRouter"              # Dependency health
```

---

## 🔐 Security Checklist

- ✅ Input sanitization (contracts + prompts)
- ✅ Rate limiting by IP
- ✅ Security headers (CSP, HSTS, X-Frame-Options)
- ✅ File upload validation (MIME type, extension, size)
- ✅ Environment variable validation
- ✅ Error messages don't leak sensitive info
- ✅ Deprecated endpoints log warnings
- ✅ No hardcoded secrets in code

---

## 🐛 Troubleshooting

### Build fails with "Cannot find module"
- Run `npm install` to ensure all dependencies are installed
- Clear `.next` directory: `rm -rf .next`
- Rebuild: `npm run build`

### Tests fail with Winston errors
- Winston is no longer used (simplified logger)
- If issues persist, run: `npm run test -- --clearCache`

### Rate limiting not working
- Verify middleware.ts is at `src/middleware.ts`
- Check that requests come from same IP
- Remember: limits reset after window expires

### Health check returns degraded
- Verify `OPENROUTER_API_KEY` is set
- Check environment variables in Vercel/hosting

---

## 📚 Further Reading

- [Next.js Security Best Practices](https://nextjs.org/docs/guides/security-best-practices)
- [OWASP Prompt Injection](https://owasp.org/www-community/attacks/Prompt_Injection)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Rate Limiting Strategies](https://cloud.google.com/architecture/rate-limiting-strategies-techniques)

---

## 🎯 Next Steps (Optional Enhancements)

1. **Redis-backed rate limiting** — For distributed systems
2. **Sentry integration** — For error tracking
3. **Application Performance Monitoring (APM)** — DataDog, New Relic
4. **Database logging** — PostgreSQL instead of console
5. **API key validation** — Check against database
6. **Request signing** — HMAC authentication
7. **Webhook events** — Notify on analysis completion
