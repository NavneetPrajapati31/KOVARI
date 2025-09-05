import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerSupabaseClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const supabase = createRouteHandlerSupabaseClient();

    // Test basic database connection
    console.log("Testing database connection...");
    
    // Check if we can access the groups table
    const { data: groups, error: groupsError } = await supabase
      .from('groups')
      .select('id, name, destination')
      .limit(5);

    if (groupsError) {
      console.error("Error accessing groups table:", groupsError);
      return NextResponse.json({ 
        error: "Database connection failed", 
        details: groupsError.message 
      }, { status: 500 });
    }

    // Check if we can access the profiles table
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, name')
      .limit(5);

    if (profilesError) {
      console.error("Error accessing profiles table:", profilesError);
    }

    return NextResponse.json({ 
      success: true,
      groups: {
        count: groups?.length || 0,
        sample: groups || [],
        error: null
      },
      profiles: {
        count: profiles?.length || 0,
        sample: profiles || [],
        error: profilesError?.message || null
      },
      message: "Database connection test completed"
    });
  } catch (err: any) {
    console.error("Database test error:", err);
    return NextResponse.json({ 
      error: "Database test failed", 
      details: err.message 
    }, { status: 500 });
  }
}
