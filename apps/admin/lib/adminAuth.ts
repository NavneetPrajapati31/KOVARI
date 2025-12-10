import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createRouteHandlerSupabaseClient } from "@/lib/supabase";

export async function requireAdmin() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const email = user.emailAddresses[0].emailAddress.toLowerCase();

  // Check if email exists in Supabase admins table
  const supabase = createRouteHandlerSupabaseClient();
  const { data: adminData, error } = await supabase
    .from("admins")
    .select("email")
    .eq("email", email.toLowerCase())
    .maybeSingle();

  if (error) {
    console.error("Error checking admin status:", error);
    redirect("/not-authorized");
  }

  if (!adminData) {
    redirect("/not-authorized");
  }

  return { userId, email };
}
