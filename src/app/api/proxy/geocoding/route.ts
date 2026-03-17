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
    const type = searchParams.get("type"); // 'autocomplete' or 'details'
    const query = searchParams.get("q");
    const placeId = searchParams.get("placeId");

    const apiKey = process.env.GEOAPIFY_API_KEY || process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    // Rate limit: 20 per minute
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const ratelimit = await checkRateLimit(`rate_limit:proxy:geoapify:${ip}`, 20, 60);
    if (!ratelimit.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    let url: URL;
    if (type === "autocomplete") {
      url = new URL("https://api.geoapify.com/v1/geocode/autocomplete");
      url.searchParams.append("text", query || "");
      url.searchParams.append("type", "city");
      url.searchParams.append("limit", "5");
      url.searchParams.append("lang", "en");
    } else if (type === "details") {
      url = new URL("https://api.geoapify.com/v1/geocode/search");
      url.searchParams.append("id", placeId || "");
    } else {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    url.searchParams.append("apiKey", apiKey);

    const res = await fetch(url.toString());
    const data = await res.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Geoapify proxy error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
