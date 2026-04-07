/**
 * SOURCE OF TRUTH for group matching.
 * All new routes must delegate here.
 * Do NOT duplicate logic elsewhere.
 */
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/get-user";
import { createRouteHandlerSupabaseClientWithServiceRole } from "@kovari/api";

const supabase = createRouteHandlerSupabaseClientWithServiceRole();
const GO_URL = process.env.GO_SERVICE_URL || "http://localhost:8080";

async function fetchWithBackoff(url: string, options: RequestInit, retries = 1, timeout = 3500) {
  for (let i = 0; i <= retries; i++) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    
    const startTime = Date.now();
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(id);
      return { response, latency: Date.now() - startTime };
    } catch (err: any) {
      clearTimeout(id);
      if (i === retries) throw err;
      await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, i)));
    }
  }
  throw new Error("Unreachable");
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    
    if (!authUser) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const { userId: reqUserId, ...payloadContext } = data;

    if (reqUserId && (reqUserId !== authUser.clerkUserId && reqUserId !== authUser.id)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const email = authUser.email;
    if (!email) {
      return NextResponse.json({ message: "No email associated with account." }, { status: 400 });
    }

    // Identity Resolution
    let { data: dbUser, error } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (error || !dbUser) {
      const { data: newUser, error: createError } = await supabase
        .from("users")
        .insert([{ email: email, clerk_user_id: authUser.clerkUserId || null }])
        .select("id")
        .single();
        
      if (createError || !newUser) {
        return NextResponse.json({ message: "Failed to resolve user identity." }, { status: 500 });
      }
      dbUser = newUser;
    }

    const dbUserId = dbUser.id;

    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get("limit");
    const isPaginatedContract = limitParam !== null; // Mobile uses limit, Web might not
    const limit = parseInt(limitParam || "100", 10);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const offset = (page - 1) * limit;

    let groups: any[] = [];
    let latency = 0;

    try {
      // Connect to Go Group Matrix API Backend
      const { response: goResponse, latency: reqLatency } = await fetchWithBackoff(`${GO_URL}/v1/match/group`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: dbUserId, context: payloadContext }),
      });
      latency = reqLatency;

      if (goResponse.ok) {
        const rawGroups = await goResponse.json();
        
        groups = Array.isArray(rawGroups) ? rawGroups.map((g: any) => ({
          ...g, // Preserve standard Go mapping (id, name, destination, etc)
          score: typeof g.score === 'number' ? g.score : 0,
        })) : [];
      } else {
        console.error(`Go matching service returned status: ${goResponse.status}`);
      }
    } catch (fetchError: any) {
      console.error("Failed to fetch from Go group matching service after retries:", fetchError.message);
    }

    const totalGroups = groups.length;
    const pagedGroups = groups.slice(offset, offset + limit);
    const hasMore = offset + limit < totalGroups;

    console.log({
      type: "GroupMatch",
      userId: dbUserId,
      groupCount: pagedGroups.length,
      hasMore,
      latency: `${latency}ms`,
      timestamp: new Date().toISOString()
    });

    if (isPaginatedContract) {
       return NextResponse.json({
         success: true,
         groups: pagedGroups,
         hasMore: hasMore
       });
    } else {
       // Legacy web
       return NextResponse.json({ groups: pagedGroups, isMLUsed: true, meta: { totalSearched: totalGroups } });
    }
  } catch (err: any) {
    console.error("Match Gateway Error:", err);
    return NextResponse.json({ groups: [], error: "Internal Server Error" }, { status: 500 });
  }
}
