import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerSupabaseClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const supabase = createRouteHandlerSupabaseClient();

    // Fetch groups with all necessary fields from the schema
    const { data: groups, error } = await supabase
      .from('groups')
      .select(`
        id,
        name,
        destination,
        budget,
        start_date,
        end_date,
        creator_id,
        non_smokers,
        non_drinkers,
        dominant_languages,
        top_interests,
        average_age,
        members_count
      `);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("Raw groups from database:", groups);

    return NextResponse.json({ 
      groups: groups || [],
      count: groups?.length || 0,
      message: "Groups fetched successfully"
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Unknown error" }, { status: 500 });
  }
}
