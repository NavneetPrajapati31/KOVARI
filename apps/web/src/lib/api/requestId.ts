/**
 * Generates a unique Request ID for traceability.
 */
export function generateRequestId(): string {
  // Use crypto.randomUUID() available since Node 14.17+ or 16+
  // If not available, fallback to a simpler timestamp-based ID or uuid package
  try {
    return (globalThis as any).crypto?.randomUUID() || 
           `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  } catch {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}
