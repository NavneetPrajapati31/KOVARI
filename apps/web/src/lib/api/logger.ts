/**
 * 🛰️ Production Logger
 * Captures deep diagnostics including internal error codes.
 */

export enum LogLevel {
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
  CRITICAL = "CRITICAL",
}

export interface LogEntry {
  requestId: string;
  route?: string;
  client?: string;
  format?: "standard" | "legacy";
  status?: number;
  latencyMs?: number;
  level: LogLevel;
  message: string;
  details?: any;
  error?: {
    message: string;
    code: string;
    details?: any;
    stack?: string;
  };
}

export const logger = {
  log: (entry: LogEntry) => {
    const { level, message, requestId, ...rest } = entry;
    const output = JSON.stringify({
      type: level,
      timestamp: new Date().toISOString(),
      requestId,
      message,
      ...rest
    });

    if (level === LogLevel.ERROR || level === LogLevel.CRITICAL) {
      process.stderr.write(output + "\n");
    } else {
      process.stdout.write(output + "\n");
    }
  },

  // Helpers for common levels
  info: (requestId: string, message: string, details?: any) => 
    logger.log({ level: LogLevel.INFO, requestId, message, details }),
  
  warn: (requestId: string, message: string, details?: any) => 
    logger.log({ level: LogLevel.WARN, requestId, message, details }),
  
  error: (requestId: string, message: string, error?: any) => 
    logger.log({ level: LogLevel.ERROR, requestId, message, error }),
    
  critical: (requestId: string, message: string, details?: any) => 
    logger.log({ level: LogLevel.CRITICAL, requestId, message, details }),

  // Backward compatibility for access/error
  access: (entry: any) => logger.log({ ...entry, level: LogLevel.INFO, message: "Access Log" }),
};

