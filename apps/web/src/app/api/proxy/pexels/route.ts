import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { checkRateLimit } from "@kovari/api";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");

    const apiKey = process.env.PEXELS_API_KEY || process.env.NEXT_PUBLIC_PEXELS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    // Rate limit: 20 per minute
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const ratelimit = await checkRateLimit(`rate_limit:proxy:pexels:${ip}`, 20, 60);
    if (!ratelimit.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(
      query || ""
    )}&orientation=square&per_page=20&page=1`;

    const response = await fetch(url, {
      headers: {
        Authorization: apiKey,
      },
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Pexels proxy error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

