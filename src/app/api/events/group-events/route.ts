// src/app/api/events/group-events/route.ts
import { createClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
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
