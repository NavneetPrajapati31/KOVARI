import { auth } from "@clerk/nextjs/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { z } from "zod";

// --- Schema validation ---
const GroupSchema = z.object({
  name: z.string().min(3),
  destination: z.string().min(2),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  is_public: z.boolean(),
  description: z.string().max(500).optional(),
});

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const body = await req.json();
    const parsed = GroupSchema.safeParse(body);

    if (!parsed.success) {
      console.error("Validation error:", parsed.error);
      return new Response(JSON.stringify(parsed.error.flatten()), {
        status: 400,
      });
    }

    const cookieStore = cookies();
    const supabase = createRouteHandlerClient(
      {
        cookies: () => cookieStore,
      },
      {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      }
    );

    const { data: userRow, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_user_id", userId)
      .maybeSingle();

    if (userError) {
      console.error("User fetch error:", userError);
      return new Response("Database error while fetching user", {
        status: 500,
      });
    }

    if (!userRow) {
      console.error("User not found for clerk_user_id:", userId);
      return new Response("User not found", { status: 404 });
    }

    const payload = {
      creator_id: userRow.id,
      ...parsed.data,
    };

    console.log("Attempting to insert payload:", payload);

    const { data, error: insertError } = await supabase
      .from("groups")
      .insert(payload)
      .select();

    if (insertError) {
      console.error("Raw insert error:", insertError);
      return new Response(
        `Failed to create group: ${JSON.stringify(insertError)}`,
        { status: 500 }
      );
    }

    console.log("Insert successful, data:", data);
    return new Response("Group created", { status: 201 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
