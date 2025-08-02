import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerSupabaseClient } from "@/lib/supabase";
import redis from "@/lib/redis";
import { calculateMatchScore, Traveler, MatchResult } from "@/matching/matchingSolo";

export async function POST(req: NextRequest) {
  const { userId } = await req.json();
  const supabase = createRouteHandlerSupabaseClient();

  // 1. Load current user's session from Redis
  const sessionStr = await redis.get(`session:user:${userId}`);
  if (!sessionStr) return NextResponse.json({ error: "No active session" }, { status: 404 });
  const dynamic = JSON.parse(sessionStr);

  // 2. Load current user's static prefs from Supabase
  const { data: userStatic } = await supabase.from("user_profiles").select("*").eq("user_id", userId).single();

  const currentUser: Traveler = {
    userId,
    dynamic,
    static: userStatic
  };

  // 3. Load all active sessions from Redis
  const keys = await redis.keys("session:user:*");
  const matched: MatchResult[] = [];

  for (const key of keys) {
    if (key === `session:user:${userId}`) continue; // skip self
    const candidateSessionStr = await redis.get(key);
    if (!candidateSessionStr) continue;
    const candidateSession = JSON.parse(candidateSessionStr);
    const candidateId = key.split(":")[2];

    const { data: candidateStatic } = await supabase.from("user_profiles").select("*").eq("user_id", candidateId).single();
    if (!candidateStatic) continue;

    const candidate: Traveler = {
      userId: candidateId,
      dynamic: candidateSession,
      static: candidateStatic
    };

    const score = calculateMatchScore(currentUser, candidate);
    matched.push({ userId: candidateId, score });
  }

  // Sort and return best matches
  matched.sort((a, b) => b.score - a.score);
  return NextResponse.json({ matches: matched });
}
