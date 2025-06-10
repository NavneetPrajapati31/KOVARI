import { auth } from "@clerk/nextjs/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2),
  age: z.number().min(13).max(100),
  gender: z.enum(["Male", "Female", "Other"]),
  birthday: z.string().datetime(),
  bio: z.string().max(300),
  profile_photo: z.string().url().optional(),
  languages: z.array(z.string()),
  nationality: z.string(),
  job: z.string(),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId)
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });

  const body = await req.json();
  const result = schema.safeParse(body);

  if (!result.success) {
    return new Response(JSON.stringify({ error: result.error.flatten() }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: cookieStore }
  );

  // First, try to get the user
  let { data: userRow, error: userFetchError } = await supabase
    .from("users")
    .select("id")
    .eq("clerk_user_id", userId)
    .maybeSingle();

  // If user is not found, try to create them
  if (!userRow && !userFetchError) {
    const { data: newUser, error: createError } = await supabase
      .from("users")
      .insert({ clerk_user_id: userId })
      .select("id")
      .single();

    if (createError) {
      console.error("Error creating user in Supabase:", createError);
      return new Response(
        JSON.stringify({
          error: "Failed to create user record in Supabase. Please try again.",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    userRow = newUser;
  } else if (userFetchError) {
    console.error("Error fetching user from Supabase:", userFetchError);
    return new Response(
      JSON.stringify({
        error: "Error accessing user record in Supabase. Please try again.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!userRow) {
    return new Response(
      JSON.stringify({
        error:
          "User record not found in Supabase and could not be created. Please try again.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const profileData = {
    user_id: userRow.id,
    ...result.data,
  };

  // Upsert profile data (insert or update)
  const { error: profileUpsertError } = await supabase
    .from("profiles")
    .upsert(profileData, { onConflict: "user_id" });

  if (profileUpsertError) {
    console.error("Error upserting profile:", profileUpsertError);
    return new Response(
      JSON.stringify({
        error: "Error saving profile. Please try again.",
        details: profileUpsertError.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ message: "Profile saved successfully" }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}
