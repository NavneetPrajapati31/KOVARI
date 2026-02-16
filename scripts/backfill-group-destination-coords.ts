#!/usr/bin/env npx tsx
/**
 * MVP: Backfill destination_lat / destination_lon for groups that have destination but no coords.
 * Run: npm run backfill-group-coords
 * Requires: .env.local with NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_GEOAPIFY_API_KEY
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
import { searchLocation } from "../src/lib/geocoding-client";

async function geocodeDestination(
  dest: string,
): Promise<{ lat: number; lon: number } | null> {
  const results = await searchLocation(dest);
  if (results?.length) return { lat: results[0].lat, lon: results[0].lon };
  return null;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("Backfilling destination coords for groups without lat/lon...\n");

  const { data: groups, error } = await supabase
    .from("groups")
    .select("id, destination, destination_lat, destination_lon")
    .or("destination_lat.is.null,destination_lon.is.null")
    .not("destination", "is", null);

  if (error) {
    console.error("Failed to fetch groups:", error);
    process.exit(1);
  }

  if (!groups?.length) {
    console.log("No groups need backfill.");
    return;
  }

  console.log(`Found ${groups.length} groups without coords.\n`);

  const uniqueDestinations = [
    ...new Set(groups.map((g) => g.destination).filter(Boolean)),
  ] as string[];
  const coordsByDest = new Map<string, { lat: number; lon: number }>();

  for (const dest of uniqueDestinations) {
    const coords = await geocodeDestination(dest);
    if (coords) {
      coordsByDest.set(dest, coords);
      console.log(`  Geocoded: ${dest} -> ${coords.lat}, ${coords.lon}`);
    } else {
      console.warn(`  Skipped (geocoding failed): ${dest}`);
    }
  }

  let updated = 0;
  for (const g of groups) {
    const coords = g.destination ? coordsByDest.get(g.destination) : null;
    if (!coords) continue;

    const { error: updateError } = await supabase
      .from("groups")
      .update({ destination_lat: coords.lat, destination_lon: coords.lon })
      .eq("id", g.id);

    if (updateError) {
      console.error(`  Failed to update group ${g.id}:`, updateError.message);
    } else {
      updated++;
    }
  }

  console.log(`\nUpdated ${updated} of ${groups.length} groups.`);
}

main().catch(console.error);
