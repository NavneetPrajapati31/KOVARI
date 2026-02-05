// -----------------------------------------------------------------------------
//   File 2: Geocoding Service (Production Implementation with OpenStreetMap)
// -----------------------------------------------------------------------------
// Location: /lib/geocoding.ts
// Purpose: To abstract the logic for converting location names into coordinates.

import redis, { ensureRedisConnection } from "./redis";

interface Coordinates {
  lat: number;
  lon: number;
}

/**
 * Converts a location name into coordinates using OpenStreetMap Nominatim, with caching.
 * @param locationName The name of the location.
 * @returns A promise that resolves to an object with lat and lon, or null.
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
      console.log(
        `Geocoding (Cache HIT): Found coordinates for "${sanitizedLocation}"`
      );
      return JSON.parse(cachedResult);
    }

    console.log(
      `Geocoding (Cache MISS): Looking up coordinates for "${sanitizedLocation}" with OpenStreetMap`
    );

    // 3. If not in cache, call the OpenStreetMap Nominatim API
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(sanitizedLocation)}&format=json&limit=1`;

    const response = await fetch(url, {
      headers: {
        // IMPORTANT: OSM requires a custom User-Agent to identify your application.
        "User-Agent":
          "Kovari Social Travel App/1.0 (your-contact-email@example.com)",
        "Accept-Language": "en",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `Nominatim API failed for "${sanitizedLocation}" with status ${response.status}: ${errorText}`
      );
      return null;
    }

    const data = await response.json();

    // 4. Parse the result and cache it
    if (data && Array.isArray(data) && data.length > 0) {
      const lat = parseFloat(data[0].lat);
      const lon = parseFloat(data[0].lon);

      // Validate coordinates
      if (isNaN(lat) || isNaN(lon)) {
        console.error(
          `Geocoding: Invalid coordinates returned for "${sanitizedLocation}": lat=${data[0].lat}, lon=${data[0].lon}`
        );
        return null;
      }

      const coords: Coordinates = { lat, lon };

      // FIX: Use setEx (Redis v4+) instead of setex (deprecated)
      await redisClient.setEx(cacheKey, 2592000, JSON.stringify(coords)); // 2592000 seconds = 30 days

      console.log(
        `Geocoding: Successfully found coordinates for "${sanitizedLocation}": ${lat}, ${lon}`
      );
      return coords;
    } else {
      // Location not found by the API
      console.warn(
        `Geocoding: No results found for "${sanitizedLocation}". The location may be misspelled or not exist in OpenStreetMap.`
      );
      return null;
    }
  } catch (error) {
    // Handle network errors or other exceptions
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Geocoding error for "${sanitizedLocation}":`, errorMessage);
    return null;
  }
};
