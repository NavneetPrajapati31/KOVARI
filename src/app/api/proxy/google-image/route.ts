import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");

    const apiKey = process.env.GOOGLE_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
    const cseId = process.env.GOOGLE_CSE_ID || process.env.NEXT_PUBLIC_GOOGLE_CSE_ID;
    
    if (!apiKey || !cseId) {
      return NextResponse.json({ error: "API configuration missing" }, { status: 500 });
    }

    // Rate limit: 20 per minute
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const ratelimit = await checkRateLimit(`rate_limit:proxy:google:${ip}`, 20, 60);
    if (!ratelimit.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const url = `https://www.googleapis.com/customsearch/v1?key=${encodeURIComponent(
      apiKey
    )}&cx=${encodeURIComponent(cseId)}&q=${encodeURIComponent(
      query || ""
    )}&searchType=image&num=10`;

    const response = await fetch(url);
    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Google proxy error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
