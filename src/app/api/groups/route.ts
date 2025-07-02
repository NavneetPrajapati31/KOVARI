import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: cookieStore }
  );
  const { data, error } = await supabase.from("groups").select("*").limit(10);
  if (error) return new Response("[]", { status: 500 });
  return new Response(JSON.stringify(data), { status: 200 });
}
