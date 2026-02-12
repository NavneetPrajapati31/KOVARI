import { createAdminSupabaseClient } from "@/lib/supabase-admin";

export async function GET() {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("groups")
    .select("*")
    .eq("status", "active") // Only show approved groups
    .limit(10);
  if (error) return new Response("[]", { status: 500 });
  return new Response(JSON.stringify(data), { status: 200 });
}
