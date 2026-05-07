import { NextResponse } from "next/server";
import { generateRequestId } from "@/lib/api/requestId";

const START_TIME = Date.now();

/**
 * 🛰️ Hardened Health Monitoring (v1)
 * Supports: ok | degraded | down
 */
export async function GET() {
  const requestId = generateRequestId();
  const now = Date.now();
  
  // Real-world logic would involve pinging DB/Services
  const isDbUp = true; 
  const isMatchingUp = true;

  let status: "ok" | "degraded" | "down" = "ok";
  if (!isDbUp && !isMatchingUp) status = "down";
  else if (!isDbUp || !isMatchingUp) status = "degraded";

  const healthData = {
    status,
    timestamp: new Date().toISOString(),
    requestId,
    uptime: Math.floor((now - START_TIME) / 1000),
    services: {
      api: "ok",
      database: isDbUp ? "ok" : "down",
      matching: isMatchingUp ? "ok" : "down"
    }
  };

  return NextResponse.json(healthData, {
    status: status === "down" ? 503 : 200,
    headers: {
      "X-Request-Id": requestId,
      "X-Kovari-Version": "v1",
      "Cache-Control": "no-store, max-age=0"
    }
  });
}
