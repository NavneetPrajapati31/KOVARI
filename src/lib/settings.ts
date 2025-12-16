import { createClient } from "@supabase/supabase-js";

// Create admin client for reading system settings
// Uses service role key to bypass RLS
const getSupabaseAdmin = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set to read system settings"
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
    },
  });
};

/**
 * Get a system setting by key
 * Returns the value JSONB object or null if not found
 */
export async function getSetting(key: string) {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", key)
      .single();

    if (error) {
      console.error(`Error fetching setting ${key}:`, error);
      return null;
    }

    return data?.value || null;
  } catch (error) {
    console.error(`Error in getSetting for ${key}:`, error);
    return null;
  }
}
