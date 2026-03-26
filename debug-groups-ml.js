import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("Fetching Jaipur groups to apply varied testing data...");
  
  const { data: groups, error: fetchError } = await supabase
    .from("groups")
    .select("id, name")
    .ilike("destination", "%jaipur%");

  if (fetchError || !groups) {
    console.error("Error fetching groups:", fetchError);
    return;
  }

  console.log(`Found ${groups.length} Jaipur groups. Applying varied test data...`);

  const variations = [
    { non_smokers: false, non_drinkers: false, average_age: 20 }, // Smokers/Drinkers Welcome, Young
    { non_smokers: true, non_drinkers: true, average_age: 35 },   // Non-Smoking/Drinking, Older
    { non_smokers: null, non_drinkers: null, average_age: 45 },   // Mixed, Oldest
    { non_smokers: false, non_drinkers: true, average_age: 25 },  // Smokers Welcome, Non-Drinking
    { non_smokers: true, non_drinkers: false, average_age: 28 },  // Non-Smoking, Drinkers Welcome
    { non_smokers: null, non_drinkers: null, average_age: 18 }    // Mixed, Youngest
  ];

  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    const variation = variations[i % variations.length];
    
    console.log(`Updating '${group.name}' with:`, variation);
    
    await supabase
      .from("groups")
      .update(variation)
      .eq("id", group.id);
  }

  console.log("All testing variations applied successfully!");
}

main().catch(console.error);
