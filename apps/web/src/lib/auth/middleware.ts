import { NextRequest } from "next/server";
import { verifyAccessToken } from "./jwt";

export interface UserContext {
  id: string;
}

/**
 * Extracts and verifies the JWT from the Authorization header for mobile requests
 */
export async function getUserFromRequest(req: NextRequest): Promise<UserContext | null> {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.split(" ")[1];
    const payload = verifyAccessToken(token);

    if (!payload || !payload.userId) {
      return null;
    }

    return {
      id: payload.userId,
    };
  } catch (error) {
    console.error("Auth middleware error:", error);
    return null;
  }
}
