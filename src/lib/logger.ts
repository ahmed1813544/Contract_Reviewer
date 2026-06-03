// Simple structured logger for Next.js compatibility
// Works on both server and edge runtimes

interface LogMeta {
  [key: string]: unknown;
}

function formatLog(level: string, message: string, meta?: LogMeta): string {
  const timestamp = new Date().toISOString();
  const metaStr = meta && Object.keys(meta).length > 0 ? JSON.stringify(meta) : '';
  return `${timestamp} [${level}] ${message} ${metaStr}`.trim();
}

const logger = {
  info: (message: string, meta?: LogMeta) => {
    console.log(formatLog('INFO', message, meta));
  },
  warn: (message: string, meta?: LogMeta) => {
    console.warn(formatLog('WARN', message, meta));
  },
  error: (message: string, meta?: LogMeta) => {
    console.error(formatLog('ERROR', message, meta));
  },
  debug: (message: string, meta?: LogMeta) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(formatLog('DEBUG', message, meta));
    }
  },
  defaultMeta: { service: 'contract-reviewer' },
};

export default logger;
