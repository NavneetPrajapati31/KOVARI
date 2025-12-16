import { NextResponse, NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getAuth } from "@clerk/nextjs/server"; // Adjust if you use a different auth

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: cookieStore }
  );

  // 1. Get the Clerk user ID
  const { userId: clerkUserId } = getAuth(req);

  if (!clerkUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Lookup the internal UUID for this Clerk user
  const { data: userRow, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("clerk_user_id", clerkUserId)
    .single();

  if (userError || !userRow) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const userUuid = userRow.id;

  // 3. Get all group_ids where user is an accepted member
  const { data: memberships, error: membershipsError } = await supabase
    .from("group_memberships")
    .select("group_id")
    .eq("user_id", userUuid)
    .eq("status", "accepted");

  if (membershipsError) {
    return NextResponse.json(
      { error: membershipsError.message },
      { status: 500 }
    );
  }

  const groupIds = memberships.map((m: any) => m.group_id);

  if (groupIds.length === 0) {
    return NextResponse.json({ travelDays: [] });
  }

  // 4. Get all groups' start_date and end_date (exclude removed groups)
  const { data: groups, error: groupsError } = await supabase
    .from("groups")
    .select("start_date, end_date")
    .in("id", groupIds)
    .neq("status", "removed");

  if (groupsError) {
    return NextResponse.json({ error: groupsError.message }, { status: 500 });
  }

  // 5. Collect all travel days (YYYY-MM-DD) between start_date and end_date for each group
  const travelDays: string[] = [];
  for (const group of groups) {
    if (group.start_date && group.end_date) {
      let current = new Date(group.start_date);
      const end = new Date(group.end_date);
      while (current <= end) {
        travelDays.push(current.toISOString().split("T")[0]);
        current.setDate(current.getDate() + 1);
      }
    }
  }

  return NextResponse.json({ travelDays });
}
