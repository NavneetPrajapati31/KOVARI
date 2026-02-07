import { auth, clerkClient } from "@clerk/nextjs/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  username: z
    .string()
    .min(3)
    .max(32)
    .regex(/^[a-zA-Z0-9_]+$/),
  age: z.number().min(13).max(100),
  gender: z.enum(["Male", "Female", "Other"]),
  birthday: z.string().datetime(),
  bio: z.string().max(300),
  profile_photo: z.string().url().optional(),
  location: z.string().min(1),
  languages: z.array(z.string()),
  nationality: z.string(),
  job: z.string(),
  religion: z.string().min(1),
  smoking: z.string().min(1),
  drinking: z.string().min(1),
  personality: z.string().min(1),
  food_preference: z.string().min(1),
  interests: z.array(z.string()).optional().default([]),
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

  // If user is not found, try to create them (always attempt creation if not found)
  if ((!userRow || !userRow.id) && !userFetchError) {
    const { data: newUser, error: createError } = await supabase
      .from("users")
      .insert({ clerk_user_id: userId })
      .select("id")
      .single();

    if (createError || !newUser) {
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

  if (!userRow || !userRow.id) {
    return new Response(
      JSON.stringify({
        error:
          "User record not found in Supabase and could not be created. Please try again.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // Check if username is already taken by another user
  const { data: existingProfile, error: existingProfileError } = await supabase
    .from("profiles")
    .select("user_id")
    .ilike("username", result.data.username)
    .not("user_id", "eq", userRow.id)
    .maybeSingle();

  if (existingProfileError) {
    console.error(
      "Error checking for existing username:",
      existingProfileError
    );
    return new Response(
      JSON.stringify({
        error: "Error checking username availability. Please try again.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  if (existingProfile) {
    return new Response(
      JSON.stringify({
        error: "Username is already taken. Please choose a different one.",
      }),
      { status: 409, headers: { "Content-Type": "application/json" } }
    );
  }

  // Get the Clerk email and persist it into profiles.email so we don't rely
  // on any dummy or trigger-generated email values.
  let primaryEmail: string | null = null;
  try {
    const clerk = await clerkClient();
    const clerkUser = await clerk.users.getUser(userId);
    const primary = clerkUser.primaryEmailAddress;
    primaryEmail =
      primary?.emailAddress ??
      clerkUser.emailAddresses[0]?.emailAddress ??
      null;
  } catch (err) {
    console.error("Error fetching Clerk user email", err);
  }

  const profileData = {
    user_id: userRow.id,
    ...(primaryEmail ? { email: primaryEmail } : {}),
    ...result.data,
  };

  // Remove keys that are not in the profiles table schema
  // @ts-ignore
  delete profileData.firstName;
  // @ts-ignore
  delete profileData.lastName;

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

  try {
    const client = await clerkClient();
    await client.users.updateUser(userId, {
      username: result.data.username,
      firstName: result.data.firstName,
      lastName: result.data.lastName,
    });
  } catch (err) {
    console.error("Error updating clerk user", err);
    return new Response(
      JSON.stringify({
        error: "Profile saved, but failed to sync username with Clerk.",
      }),
      { status: 500 }
    );
  }

  return new Response(
    JSON.stringify({ message: "Profile saved successfully" }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}
