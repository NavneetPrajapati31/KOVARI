// src/app/api/events/group-events/route.ts
import { createClient } from "@kovari/api";
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";

export async function GET(req: NextRequest) {
  const { userId } = getAuth(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const destination = searchParams.get("destination");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const supabase = createClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .ilike("destination", `%${destination || ""}%`)
    .gte("event_date", from)
    .lte("event_date", to);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

