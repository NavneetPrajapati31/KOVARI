import { createAdminSupabaseClient, createRouteHandlerSupabaseClientWithServiceRole } from "@kovari/api";
import { getAuthenticatedUser } from "@/lib/auth/get-user";
import { z } from "zod";

const verifyEmailSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
});

export async function POST(req: Request) {
  const user = await getAuthenticatedUser(req as any);
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const result = verifyEmailSchema.safeParse(body);

    if (!result.success) {
      return new Response(JSON.stringify({ error: "Invalid email or verification code" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { email, code } = result.data;
    const adminSupabase = createRouteHandlerSupabaseClientWithServiceRole();

    // 1. Fetch and Validate Code
    const { data: verification, error: fetchError } = await adminSupabase
      .from("verification_codes")
      .select("*")
      .eq("email", email)
      .eq("code", code)
      .maybeSingle();

    if (fetchError || !verification) {
      return new Response(JSON.stringify({ error: "Invalid verification code" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check expiration
    if (new Date(verification.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "Verification code has expired" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. Perform Update (Atomic-ish)
    const supabase = createAdminSupabaseClient();
    
    // Update profiles table
    const { error: profileEmailError } = await supabase
      .from("profiles")
      .update({ email: email })
      .eq("user_id", user.id);

    if (profileEmailError) {
      console.error("Error updating profile email during verification:", profileEmailError);
      return new Response(JSON.stringify({ error: "Failed to update profile email" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // If mobile user (Unified SOT), also update users table
    if (!user.clerkUserId) {
      const { error: userEmailError } = await supabase
        .from("users")
        .update({ email: email })
        .eq("id", user.id);

      if (userEmailError) {
        console.error("Error updating user email (mobile) during verification:", userEmailError);
        // We proceed as profile is updated, but this is an inconsistency risk
      }
    }

    // 3. Cleanup
    await adminSupabase.from("verification_codes").delete().eq("email", email);

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Email verified and updated successfully" 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Critical error in /api/profile/verify-email:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
