import { auth } from "@clerk/nextjs/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { z } from "zod";

const PreferencesSchema = z.object({
  destinations: z.array(z.string()).min(1),
  trip_focus: z.array(z.string()).optional(),
  frequency: z.string().optional(),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const body = await req.json();
  const parsed = PreferencesSchema.safeParse(body);

  if (!parsed.success) {
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

  const { data: userRow, error } = await supabase
    .from("users")
    .select("id")
    .eq("clerk_user_id", userId)
    .maybeSingle();

  let userIdInSupabase = userRow?.id;
  if ((!userRow || !userRow.id) && !error) {
    const { data: newUser, error: createError } = await supabase
      .from("users")
      .insert({ clerk_user_id: userId })
      .select("id")
      .single();
    if (createError || !newUser) {
      console.error("Error creating user in Supabase:", createError);
      return new Response("Failed to create user record in Supabase", {
        status: 500,
      });
    }
    userIdInSupabase = newUser.id;
  } else if (error) {
    return new Response("User not found", { status: 404 });
  }
  if (!userIdInSupabase) {
    return new Response("User not found after creation attempt", {
      status: 404,
    });
  }

  const payload = {
    user_id: userIdInSupabase,
    ...parsed.data,
  };

  // Check for existing row
  const { data: existing } = await supabase
    .from("travel_preferences")
    .select("id")
    .eq("user_id", userIdInSupabase)
    .maybeSingle();

  if (existing) {
    const { error: updateError } = await supabase
      .from("travel_preferences")
      .update(payload)
      .eq("user_id", userIdInSupabase);

    if (updateError) {
      console.error("Supabase update error:", updateError);
      return new Response("Failed to update preferences", { status: 500 });
    }

    return new Response("Preferences updated", { status: 200 });
  }

  const { error: insertError } = await supabase
    .from("travel_preferences")
    .insert(payload);

  if (insertError) {
    console.error("Supabase insert error:", insertError);
    return new Response("Failed to save preferences", { status: 500 });
  }

  return new Response("Preferences saved", { status: 201 });
}
