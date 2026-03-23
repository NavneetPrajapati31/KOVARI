import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { searchLocationDirect, getLocationDetailsDirect } from "@/lib/geocoding-core";

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

    // Rate limit: 20 per minute
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const ratelimit = await checkRateLimit(`rate_limit:proxy:geoapify:${ip}`, 20, 60);
    if (!ratelimit.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    if (type === "autocomplete") {
      if (!query) return NextResponse.json({ features: [] });
      const results = await searchLocationDirect(query);
      // Return in the format expected by the client (Geoapify features format)
      // Note: searchLocationDirect returns simplified objects, so we wrap them back if needed
      // or we can just return the raw data by fetching in route.ts, but let's keep it consistent
      
      // Actually, it's better if searchLocationDirect returns the raw features if we want to keep the same format
      // but let's just make route.ts return what it needs.
      
      // Let's modify geocoding-core.ts to optionally return raw data or just move the fetch logic here.
      // Re-implementing the fetch logic here for format compatibility.
      const apiKey = process.env.GEOAPIFY_API_KEY || process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY;
      const url = new URL("https://api.geoapify.com/v1/geocode/autocomplete");
      url.searchParams.append("text", query);
      url.searchParams.append("type", "city");
      url.searchParams.append("limit", "5");
      url.searchParams.append("lang", "en");
      url.searchParams.append("apiKey", apiKey!);
      
      const res = await fetch(url.toString());
      const data = await res.json();
      return NextResponse.json(data);
    } else if (type === "details") {
      if (!placeId) return NextResponse.json({ features: [] });
      const apiKey = process.env.GEOAPIFY_API_KEY || process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY;
      const url = new URL("https://api.geoapify.com/v1/geocode/search");
      url.searchParams.append("id", placeId);
      url.searchParams.append("apiKey", apiKey!);
      
      const res = await fetch(url.toString());
      const data = await res.json();
      return NextResponse.json(data);
    } else {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }
  } catch (error) {
    console.error("Geoapify proxy error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
