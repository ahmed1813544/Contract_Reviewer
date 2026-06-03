/**
 * Sanitize contract text to prevent prompt injection attacks
 * Removes or escapes suspicious patterns that could manipulate AI behavior
 */
export function sanitizeContractText(text: string): string {
  // Remove common prompt injection patterns
  let sanitized = text;

  // Remove directives that could manipulate the AI
  const injectionPatterns = [
    /ignore\s+previous\s+instructions/gi,
    /disregard\s+the\s+above/gi,
    /system\s+prompt/gi,
    /you\s+are\s+now/gi,
    /act\s+as\s+if/gi,
    /pretend\s+to\s+be/gi,
  ];

  for (const pattern of injectionPatterns) {
    sanitized = sanitized.replace(pattern, '');
  }

  // Trim and clean up excess whitespace
  sanitized = sanitized.replace(/\s+/g, ' ').trim();

  // The original text must have at least 20 words (checked before calling this)
  // We don't re-check here since injection patterns are typically short phrases
  // Just validate that we didn't remove everything
  if (!sanitized) {
    throw new Error('Contract text is empty after sanitization');
  }

  return sanitized;
}

/**
 * Sanitize the prompt itself to prevent injection through system messages
 */
export function sanitizePrompt(prompt: string): string {
  // Escape any special characters that could break the prompt structure
  return prompt.replace(/[\n\r]/g, ' ').trim();
}
