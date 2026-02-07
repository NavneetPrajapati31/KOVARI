
// -----------------------------------------------------------------------------
//   File: Geocoding Service (Geoapify Implementation)
// -----------------------------------------------------------------------------
// Location: /lib/geocoding.ts
// Purpose: Server-side geocoding logic with Redis caching.

import redis, { ensureRedisConnection } from "./redis";
import { searchLocation, Coordinates } from "./geocoding-client";

// Re-export client types and functions for convenience on server-side
export * from "./geocoding-client";

/**
 * Converts a location name into coordinates using Geoapify (replacing Nominatim), with Redis caching.
 * Used by backend API routes.
 */
export const getCoordinatesForLocation = async (
  locationName: string
): Promise<Coordinates | null> => {
  // Validate and sanitize input
  if (!locationName || typeof locationName !== "string") {
    console.error("Geocoding: Invalid location name provided:", locationName);
    return null;
  }

  const sanitizedLocation = locationName.trim();
  if (!sanitizedLocation) {
    console.error("Geocoding: Empty location name provided");
    return null;
  }

  const cacheKey = `geo:${sanitizedLocation.toLowerCase().replace(/\s+/g, "_")}`;

  try {
    // 1. Ensure Redis is connected
    const redisClient = await ensureRedisConnection();

    // 2. Check cache first
    const cachedResult = await redisClient.get(cacheKey);
    if (cachedResult) {
      // console.log(`Geocoding (Cache HIT): Found coordinates for "${sanitizedLocation}"`);
      return JSON.parse(cachedResult);
    }

    // console.log(`Geocoding (Cache MISS): Looking up coordinates for "${sanitizedLocation}" with Geoapify`);

    // 3. If not in cache, call Geoapify
    // We reuse the searchLocation function from the client library but execute it server-side (node-fetch is polyfilled in Next.js)
    const results = await searchLocation(sanitizedLocation);
    
    if (results && results.length > 0) {
      const topResult = results[0];
      const coords: Coordinates = { lat: topResult.lat, lon: topResult.lon };

      // Cache it
      await redisClient.setEx(cacheKey, 2592000, JSON.stringify(coords)); // 30 days

      return coords;
    } else {
      console.warn(`Geocoding: No results found for "${sanitizedLocation}"`);
      return null;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Geocoding error for "${sanitizedLocation}":`, errorMessage);
    return null;
  }
};
