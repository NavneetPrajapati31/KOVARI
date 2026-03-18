import { UserProfile } from "@/shared/hooks/use-user-profile";
import { createBrowserClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";

const getSupabaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL is not defined. Please check your environment variables.",
    );
  }
  return url;
};

const getSupabaseAnonKey = () => {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined. Please check your environment variables.",
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

export const createClientWithAuth = (supabaseToken?: string | null) => {
  try {
    return createSupabaseClient(getSupabaseUrl(), getSupabaseAnonKey(), {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      accessToken: async () => supabaseToken ?? null,
    });
  } catch (error) {
    console.error("Failed to create authed Supabase client:", error);
    throw error;
  }
};

// For API/server routes (uses anon key, subject to RLS)
export const createRouteHandlerSupabaseClient = () => {
  try {
    return createSupabaseClient(getSupabaseUrl(), getSupabaseAnonKey(), {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
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
    // Fixed: Use createSupabaseClient which is already imported
    return createSupabaseClient(getSupabaseUrl(), serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  } catch (error) {
    console.error("Failed to create Supabase server client with service role:", error);
    throw error;
  }
};

/**
 * Helper function to get the Supabase UUID from a Clerk ID
 */
export const getSupabaseUuidFromClerkId = async (
  clerkId: string,
): Promise<string | null> => {
  const supabase = createRouteHandlerSupabaseClientWithServiceRole();
  const { data, error } = await supabase
    .from("users")
    .select("id")
    .eq("clerk_user_id", clerkId)
    .eq("isDeleted", false)
    .maybeSingle();

  if (error) {
    if (error.code !== 'PGRST116') {
      console.warn("Failed to fetch user UUID for Clerk ID:", clerkId, error.message);
    }
    return null;
  }
  
  return data?.id || null;
};

/**
 * Fetches the full user profile including preferences and basic info
 */
export const getUserProfile = async (
  clerkId: string,
): Promise<UserProfile | null> => {
  const supabase = createRouteHandlerSupabaseClientWithServiceRole();
  
  const supabaseUuid = await getSupabaseUuidFromClerkId(clerkId);
  if (!supabaseUuid) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", supabaseUuid)
    .maybeSingle();

  if (error) {
    if (error.code !== 'PGRST116') {
      console.warn('Error fetching user profile with Supabase UUID:', error.message);
    }
    return null;
  }
  
  return data;
};

