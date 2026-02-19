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

// For API/server routes (uses anon key, subject to RLS)
export const createRouteHandlerSupabaseClient = () => {
  try {
    return createServerClient(getSupabaseUrl(), getSupabaseAnonKey());
  } catch (error) {
    console.error("Failed to create Supabase server client:", error);
    throw error;
  }
};

// For API/server routes that need to bypass RLS (uses service role key)
export const createRouteHandlerSupabaseClientWithServiceRole = () => {
  try {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      console.warn("SUPABASE_SERVICE_ROLE_KEY not found, falling back to anon key");
      return createRouteHandlerSupabaseClient();
    }
    return createServerClient(getSupabaseUrl(), serviceRoleKey);
  } catch (error) {
    console.error("Failed to create Supabase server client with service role:", error);
    throw error;
  }
};

// Helper function to get the Supabase UUID from a Clerk ID
// Uses service role key to bypass RLS for server-side operations
const getSupabaseUuidFromClerkId = async (clerkId: string): Promise<string | null> => {
  const supabase = createRouteHandlerSupabaseClientWithServiceRole();
  const { data, error } = await supabase
      .from("users") // Your mapping table
      .select("id") // The column with the Supabase UUID
      .eq("clerk_user_id", clerkId) // The column with the Clerk ID
      .maybeSingle(); // Use maybeSingle() to handle missing users gracefully

  if (error) {
      // Only log if it's not a "not found" error (PGRST116)
      if (error.code !== 'PGRST116') {
          console.warn("Failed to fetch user UUID for Clerk ID:", clerkId, error.message);
      }
      return null;
  }
  
  if (!data) {
      // User not found - this is normal for new users who haven't completed onboarding
      return null;
  }
  
  return data.id;
};

// Re-adding the exported helper function
// Uses service role key to bypass RLS for server-side operations
export const getUserProfile = async (clerkId: string): Promise<UserProfile | null> => {
  const supabase = createRouteHandlerSupabaseClientWithServiceRole();
  
  // Step 1: Get the Supabase UUID from the Clerk ID
  const supabaseUuid = await getSupabaseUuidFromClerkId(clerkId);

  if (!supabaseUuid) {
      // User not found in database - this is normal for new users
      return null;
  }

  // Step 2: Use the correct Supabase UUID to fetch the profile
  const { data, error } = await supabase
      .from('profiles')
      .select('*')
      // FIX: Query against the `user_id` foreign key column, not the `id` primary key.
      .eq('user_id', supabaseUuid)
      .maybeSingle(); // Use maybeSingle() to handle missing profiles gracefully

  if (error) {
      // Only log if it's not a "not found" error
      if (error.code !== 'PGRST116') {
          console.warn('Error fetching user profile with Supabase UUID:', error.message);
      }
      return null;
  }
  
  if (!data) {
      // Profile not found - user exists but profile is incomplete
      return null;
  }
  
  return data;
};
