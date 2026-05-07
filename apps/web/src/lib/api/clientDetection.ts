import { NextRequest } from "next/server";
import { KovariClient } from "@/types/api";

/**
 * 🏛️ STRICT Client Detection
 * Enforces production-safe client identification.
 * Rejects unknown or malformed clients with 400.
 */
export function detectClient(request: NextRequest): { client: KovariClient; error?: string } {
  const clientHeader = request.headers.get("x-kovari-client")?.toLowerCase();

  // Rule: Default to web for backward compatibility with established web app
  if (!clientHeader) {
    return { client: "web" };
  }

  const validClients: KovariClient[] = ["web", "mobile", "internal"];
  
  if (validClients.includes(clientHeader as KovariClient)) {
    return { client: clientHeader as KovariClient };
  }

  // Final Production Guard: Reject everything else
  return { 
    client: "web", 
    error: `Invalid X-Kovari-Client: '${clientHeader}'. Known clients: [${validClients.join(", ")}]` 
  };
}
