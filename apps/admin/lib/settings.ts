import { supabaseAdmin } from "./supabaseAdmin";

export async function getSetting(key: string) {
  const { data } = await supabaseAdmin
    .from("system_settings")
    .select("value")
    .eq("key", key)
    .single();

  return data?.value;
}

export async function updateSetting(
  key: string,
  value: unknown,
  adminId: string
) {
  await supabaseAdmin.from("system_settings").upsert({
    key,
    value,
    updated_by: adminId,
    updated_at: new Date().toISOString(),
  });
}
