import { UserProfile } from "@/shared/hooks/use-user-profile";
import { createBrowserClient } from "@supabase/ssr";
import { createClient as createServerClient } from "@supabase/supabase-js";

const getSupabaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL is not defined. Please check your environment variables."
    );
  }
  return url;
};

const getSupabaseAnonKey = () => {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined. Please check your environment variables."
    );
  }
  return key;
};

export const createClient = () => {
  try {
    return createBrowserClient(getSupabaseUrl(), getSupabaseAnonKey());
  } catch (error) {
    console.error("Failed to create Supabase client:", error);
    throw error;
  }
};

// For API/server routes
export const createRouteHandlerSupabaseClient = () => {
  try {
    return createServerClient(getSupabaseUrl(), getSupabaseAnonKey());
  } catch (error) {
    console.error("Failed to create Supabase server client:", error);
    throw error;
  }
};

// Helper function to get the Supabase UUID from a Clerk ID
const getSupabaseUuidFromClerkId = async (clerkId: string): Promise<string | null> => {
  const supabase = createRouteHandlerSupabaseClient();
  const { data, error } = await supabase
      .from("users") // Your mapping table
      .select("id") // The column with the Supabase UUID
      .eq("clerk_user_id", clerkId) // The column with the Clerk ID
      .single();

  if (error) {
      console.error("Failed to fetch user UUID for Clerk ID:", clerkId, error);
      return null;
  }
  return data.id;
};

// Re-adding the exported helper function
export const getUserProfile = async (clerkId: string): Promise<UserProfile | null> => {
  const supabase = createRouteHandlerSupabaseClient();
  
  // Step 1: Get the Supabase UUID from the Clerk ID
  const supabaseUuid = await getSupabaseUuidFromClerkId(clerkId);

  if (!supabaseUuid) {
      console.error(`No Supabase user found for Clerk ID: ${clerkId}`);
      return null;
  }

  // Step 2: Use the correct Supabase UUID to fetch the profile
  const { data, error } = await supabase
      .from('profiles')
      .select('*')
      // FIX: Query against the `user_id` foreign key column, not the `id` primary key.
      .eq('user_id', supabaseUuid)
      .single();

  if (error) {
      console.error('Error fetching user profile with Supabase UUID:', error);
      return null;
  }
  return data;
};
