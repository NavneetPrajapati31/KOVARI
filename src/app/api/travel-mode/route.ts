import { auth } from "@clerk/nextjs/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { z } from "zod";

const schema = z.object({
  mode: z.enum(["solo", "group"]),
});

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      console.error("No user ID found in auth");
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      console.error("Invalid request body:", parsed.error);
      return new Response(JSON.stringify(parsed.error.flatten()), {
        status: 400,
      });
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name) => {
            const cookie = cookieStore.get(name);
            return cookie?.value;
          },
          set: (name, value, options) => {
            cookieStore.set(name, value, options);
          },
          remove: (name, options) => {
            cookieStore.delete(name);
          },
        },
      }
    );

    const { data: userRow, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_user_id", userId)
      .maybeSingle();

    if (userError) {
      console.error("Error fetching user:", userError);
      return new Response("Database error while fetching user", {
        status: 500,
      });
    }

    if (!userRow) {
      console.error("User not found for clerk_user_id:", userId);
      return new Response("User not found", { status: 404 });
    }

    const payload = {
      user_id: userRow.id,
      mode: parsed.data.mode,
    };

    const { data: existing, error: existingError } = await supabase
      .from("travel_modes")
      .select("*")
      .eq("user_id", userRow.id)
      .maybeSingle();

    if (existingError) {
      console.error("Error checking existing mode:", existingError);
      return new Response("Database error while checking existing mode", {
        status: 500,
      });
    }

    if (existing) {
      const { error: updateError } = await supabase
        .from("travel_modes")
        .update(payload)
        .eq("user_id", userRow.id);

      if (updateError) {
        console.error("Error updating mode:", updateError);
        return new Response("Failed to update mode", { status: 500 });
      }

      return new Response("Mode updated", { status: 200 });
    }

    const { error: insertError } = await supabase
      .from("travel_modes")
      .insert(payload);
    if (insertError) {
      console.error("Error inserting mode:", insertError);
      return new Response(`Failed to save mode: ${insertError.message}`, {
        status: 500,
      });
    }

    return new Response("Mode saved", { status: 201 });
  } catch (error) {
    console.error("Unexpected error in travel-mode API:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
