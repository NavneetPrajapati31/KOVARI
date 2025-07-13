import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client (adjust with your env vars or config)
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function GET() {
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

  const { data, error } = await supabase.rpc('execute_sql', { sql });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ trips: data });
}
