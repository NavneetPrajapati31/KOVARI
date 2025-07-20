import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerSupabaseClient } from "@/lib/supabase";
import { matchGroupsWeighted, Traveler, Group } from "@/matching/groups/matchGroup";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { destination, budget, startDate, endDate } = data;
    if (!destination || !budget || !startDate || !endDate) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const supabase = createRouteHandlerSupabaseClient();
    const { data: groups, error } = await supabase
      .from("groups")
      .select(`
        id,
        name,
        is_public,
        destination,
        start_date,
        end_date,
        created_at,
        description,
        cover_image,
        notes,
        members_count,
        budget,
        creator_id
      `);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!groups) {
      return NextResponse.json({ groups: [] });
    }

    // Map groups to the shape expected by matchGroupsWeighted
    const groupObjs: Group[] = groups.map((g: any) => ({
      id: g.id,
      destination: g.destination,
      budget: Number(g.budget),
      startDate: new Date(g.start_date),
      endDate: new Date(g.end_date),
    }));

    const traveler: Traveler = {
      destination,
      budget: Number(budget),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    };

    // Run the matching algorithm
    const matches = matchGroupsWeighted(traveler, groupObjs);

    // Attach the match score to the original group data for display
    const matchedGroups = matches.map((match) => {
      const original = groups.find((g: any) => g.id === match.id);
      return { ...original, score: match.score };
    });

    return NextResponse.json({ groups: matchedGroups });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Unknown error" }, { status: 500 });
  }
} 