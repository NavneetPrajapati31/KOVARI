import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerSupabaseClient } from "@/lib/supabase";
import { matchGroupsWeighted, Traveler, Group } from "@/matching/groups/matchGroup";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    // Validate input
    const { destination, budget, startDate, endDate } = data;
    if (!destination || !budget || !startDate || !endDate) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const traveler: Traveler = {
      destination,
      budget: Number(budget),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    };

    const supabase = createRouteHandlerSupabaseClient();
    const { data: groups, error } = await supabase
      .from("groups")
      .select("id, destination, budget, start_date, end_date");
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!groups) {
      return NextResponse.json({ groups: [] });
    }

    // Convert group dates to Date objects using correct field names
    const groupObjs: Group[] = groups.map((g: any) => ({
      id: g.id,
      destination: g.destination,
      budget: Number(g.budget),
      startDate: new Date(g.start_date),
      endDate: new Date(g.end_date),
    }));

    const matches = matchGroupsWeighted(traveler, groupObjs);
    return NextResponse.json({ groups: matches });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Unknown error" }, { status: 500 });
  }
} 