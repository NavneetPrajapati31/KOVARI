import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { createRouteHandlerSupabaseClient } from "@/lib/supabase";

/**
 * Requires admin authentication. For use in API routes.
 * Returns admin data or throws an error that should be caught and returned as NextResponse.
 *
 * @throws {NextResponse} If user is not authenticated or not an admin
 */
export async function requireAdmin(): Promise<{
  adminId: string;
  email: string;
}> {
  const { userId } = await auth();
  if (!userId) {
    throw NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const email = user.emailAddresses[0].emailAddress.toLowerCase();

  // Check if email exists in Supabase admins table
  const supabase = createRouteHandlerSupabaseClient();
  const { data: adminData, error } = await supabase
    .from("admins")
    .select("id, email")
    .eq("email", email.toLowerCase())
    .maybeSingle();

  if (error) {
    console.error("Error checking admin status:", error);
    throw NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!adminData) {
    throw NextResponse.json(
      { error: "Forbidden: Admin access required" },
      { status: 403 }
    );
  }

  return { adminId: adminData.id, email: adminData.email };
}

/**
 * Requires admin authentication. For use in Server Components/Pages.
 * Redirects to sign-in or not-authorized pages.
 */
export async function requireAdminPage(): Promise<{
  adminId: string;
  email: string;
}> {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const email = user.emailAddresses[0].emailAddress.toLowerCase();

  // Check if email exists in Supabase admins table
  const supabase = createRouteHandlerSupabaseClient();
  const { data: adminData, error } = await supabase
    .from("admins")
    .select("id, email")
    .eq("email", email.toLowerCase())
    .maybeSingle();

  if (error) {
    console.error("Error checking admin status:", error);
    redirect("/not-authorized");
  }

  if (!adminData) {
    redirect("/not-authorized");
  }

  return { adminId: adminData.id, email: adminData.email };
}
