import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("groups")
    .select("*")
    .eq("status", "active") // Only show approved groups
    .limit(10);
  if (error) return new Response("[]", { status: 500 });
  return new Response(JSON.stringify(data), { status: 200 });
}
