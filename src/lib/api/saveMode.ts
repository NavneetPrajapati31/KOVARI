import { createClient } from '../supabase';

export async function saveTravelMode(userId: string, mode: string) {
  const supabase = createClient(); // ✅ Call the function to get the client

  const { error } = await supabase
    .from('users')
    .update({ travel_mode: mode })
    .eq('id', userId);

  return { error };
}
