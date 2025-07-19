import { NextResponse } from "next/server";
import { createRouteHandlerSupabaseClient } from "@/lib/supabase";

export async function GET() {
  try {
    const supabase = createRouteHandlerSupabaseClient();

    // SQL to fetch done trips with calculated duration
    const sql = `
      SELECT
        id,
        name AS city,
        to_char(start_date, 'DD Mon') || ' - ' || to_char(end_date, 'DD Mon') AS dates,
        (end_date - start_date + 1) || ' days' AS duration,
        cover_image AS image,
        TRUE AS "isCompleted"
      FROM
        public.groups
      WHERE
        end_date IS NOT NULL
        AND end_date < CURRENT_DATE
      ORDER BY
        end_date DESC;
    `;

    const { data, error } = await supabase.rpc("execute_sql", { sql });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ trips: data });
  } catch (error) {
    console.error("Error in DoneTrips API:", error);
    return NextResponse.json(
      { error: "Failed to fetch done trips" },
      { status: 500 }
    );
  }
}
