/**
 * SOURCE OF TRUTH for solo matching.
 * All new routes must delegate here.
 * Do NOT duplicate logic elsewhere.
 */
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/get-user";
import { createRouteHandlerSupabaseClientWithServiceRole } from "@kovari/api";

const supabase = createRouteHandlerSupabaseClientWithServiceRole();
const GO_URL = process.env.GO_SERVICE_URL || "http://localhost:8080";

async function fetchWithBackoff(url: string, options: RequestInit, retries = 1, timeout = 15000) {
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

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    
    if (!authUser) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userIdQuery = searchParams.get("userId");
    
    if (userIdQuery && (userIdQuery !== authUser.clerkUserId && userIdQuery !== authUser.id)) {
      // Legacy backwards-compatibility check used by the web app
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

    const limitParam = searchParams.get("limit");
    const isPaginatedContract = limitParam !== null; // True for mobile, False for web
    const limit = parseInt(limitParam || "100", 10);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const offset = (page - 1) * limit;

    let matches: any[] = [];
    let latency = 0;

    try {
      // Go Service Target
      const { response: goResponse, latency: reqLatency } = await fetchWithBackoff(`${GO_URL}/v1/match/solo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: dbUserId }),
      });
      latency = reqLatency;

      if (goResponse.ok) {
        const rawMatches = await goResponse.json();
        
        matches = Array.isArray(rawMatches) ? rawMatches.map((m: any) => ({
          userId: m.userId || (m.user && m.user.userId) || '',
          user: {
            ...m.user,
            userId: m.userId,
            name: m.user?.name || m.user?.full_name || 'Unknown',
            age: typeof m.user?.age === 'number' ? m.user.age : 0,
            locationDisplay: m.user?.location || m.user?.locationDisplay || 'Unknown',
            avatar: m.user?.avatar || '',
            // Add extended profile for web consistency if needed
            smoking: m.user?.smoking,
            drinking: m.user?.drinking,
            interests: m.user?.interests,
            languages: m.user?.languages,
            personality: m.user?.personality,
            nationality: m.user?.nationality,
            religion: m.user?.religion,
            profession: m.user?.profession,
            bio: m.user?.bio,
            foodPreference: m.user?.foodPreference,
          },
          // Mobile specific flattened props
          name: m.user?.name || m.user?.full_name || 'Unknown',
          age: typeof m.user?.age === 'number' ? m.user.age : 0,
          location: m.user?.location || m.user?.locationDisplay || 'Unknown',
          profilePhoto: m.user?.avatar || '',
          compatibilityScore: typeof m.score === 'number' ? m.score : 0,
          score: typeof m.score === 'number' ? m.score : 0, // Fallback for Web
          breakdown: m.breakdown || {},
          budgetDifference: m.budgetDifference || 0,
          foodPreference: m.user?.foodPreference,
          // New Trip Specifics
          start_date: m.startDate,
          end_date: m.endDate,
          budget: m.budget
        })) : [];
      } else {
        console.error(`Go matching service returned status: ${goResponse.status}`);
      }
    } catch (fetchError: any) {
      console.error("Failed to fetch from Go matching service after retries:", fetchError.message);
    }

    const totalMatches = matches.length;
    const pagedMatches = matches.slice(offset, offset + limit);
    const hasMore = offset + limit < totalMatches;

    console.log({
      userId: dbUserId,
      matchCount: pagedMatches.length,
      hasMore,
      latency: `${latency}ms`,
      timestamp: new Date().toISOString()
    });

    if (isPaginatedContract) {
      // Mobile paginated format
      return NextResponse.json({
        success: true,
        matches: pagedMatches,
        hasMore: hasMore
      });
    } else {
      // Legacy Web Raw Array format
      return NextResponse.json(pagedMatches);
    }
  } catch (err: any) {
    console.error("Match Gateway Error:", err);
    return NextResponse.json([], { status: 500 });
  }
}
