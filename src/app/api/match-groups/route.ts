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

    const traveler: Traveler = {
      destination,
      budget: Number(budget),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    };

    const supabase = createRouteHandlerSupabaseClient();

    // This will fail if no relationship exists
    const { data: groups, error } = await supabase
      .from('groups')
      .select(', profiles()');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!groups) {
      return NextResponse.json({ groups: [] });
    }

   
    const groupObjs: Group[] = groups.map((g: any) => ({
      id: g.id,
      destination: g.destination,
      budget: Number(g.budget),
      startDate: new Date(g.start_date),
      endDate: new Date(g.end_date),
      creator: {
        name: g.creator?.name || "Unknown",
        username: g.creator?.username || "unknown",
        avatar: g.creator?.profile_photo || "",
      },
    }));

    const matches = matchGroupsWeighted(traveler, groupObjs);

    // Ensure all groups include creator (just in case)
    const safeMatches = matches.map((group) => ({
      ...group,
      creator: group.creator || {
        name: "Unknown",
        username: "unknown",
        avatar: "",
      },
    }));

    return NextResponse.json({ groups: safeMatches });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Unknown error" }, { status: 500 });
}
}
