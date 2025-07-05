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
