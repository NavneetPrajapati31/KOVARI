/**
 * 🛰️ Production Logger
 * Captures deep diagnostics including internal error codes.
 */

export interface LogEntry {
  requestId: string;
  route: string;
  client: string;
  format: "standard" | "legacy";
  status: number;
  latencyMs: number;
  error?: {
    message: string;
    code: string;
    details?: any;
    stack?: string;
  };
}

export const logger = {
  access: (entry: LogEntry) => {
    const { requestId, route, client, format, status, latencyMs } = entry;
    process.stdout.write(JSON.stringify({
      type: "ACCESS",
      timestamp: new Date().toISOString(),
      requestId,
      route,
      client,
      format,
      status,
      latencyMs
    }) + "\n");
  },
  
  error: (entry: LogEntry) => {
    // Error logs always include full context and internal codes
    process.stderr.write(JSON.stringify({
      type: "ERROR",
      timestamp: new Date().toISOString(),
      ...entry
    }) + "\n");
  }
};
