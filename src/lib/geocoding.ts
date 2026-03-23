import redis, { ensureRedisConnection } from "./redis";
import { searchLocationDirect as searchLocation, Coordinates } from "./geocoding-core";

// Re-export client types and functions for convenience on server-side
export * from "./geocoding-client";

// Fallback coordinates for common Indian destinations
const FALLBACK_COORDINATES: Record<string, Coordinates> = {
  goa: { lat: 15.2993, lon: 74.124 },
  "goa, india": { lat: 15.2993, lon: 74.124 },
  "goa, goa": { lat: 15.2993, lon: 74.124 },
  mumbai: { lat: 19.076, lon: 72.8777 },
  "mumbai, india": { lat: 19.076, lon: 72.8777 },
  "mumbai, maharashtra": { lat: 19.076, lon: 72.8777 },
  "mumbai, maharashtra, india": { lat: 19.076, lon: 72.8777 },
  delhi: { lat: 28.7041, lon: 77.1025 },
  "delhi, india": { lat: 28.7041, lon: 77.1025 },
  "delhi, delhi": { lat: 28.7041, lon: 77.1025 },
  "new delhi": { lat: 28.6139, lon: 77.209 },
  "new delhi, india": { lat: 28.6139, lon: 77.209 },
  "new delhi, delhi": { lat: 28.6139, lon: 77.209 },
  manali: { lat: 32.2432, lon: 77.1892 },
  "manali, india": { lat: 32.2432, lon: 77.1892 },
  rishikesh: { lat: 30.0869, lon: 78.2676 },
  "rishikesh, india": { lat: 30.0869, lon: 78.2676 },
  bangalore: { lat: 12.9716, lon: 77.5946 },
  "bangalore, india": { lat: 12.9716, lon: 77.5946 },
  bengaluru: { lat: 12.9716, lon: 77.5946 },
  "bengaluru, india": { lat: 12.9716, lon: 77.5946 },
  hyderabad: { lat: 17.385, lon: 78.4867 },
  "hyderabad, india": { lat: 17.385, lon: 78.4867 },
  chennai: { lat: 13.0827, lon: 80.2707 },
  "chennai, india": { lat: 13.0827, lon: 80.2707 },
  kolkata: { lat: 22.5726, lon: 88.3639 },
  "kolkata, india": { lat: 22.5726, lon: 88.3639 },
  pune: { lat: 18.5204, lon: 73.8567 },
  "pune, india": { lat: 18.5204, lon: 73.8567 },
  jaipur: { lat: 26.9124, lon: 75.7873 },
  "jaipur, india": { lat: 26.9124, lon: 75.7873 },
  udaipur: { lat: 24.5854, lon: 73.7125 },
  "udaipur, india": { lat: 24.5854, lon: 73.7125 },
  kerala: { lat: 10.1632, lon: 76.6413 },
  "kerala, india": { lat: 10.1632, lon: 76.6413 },
  kashmir: { lat: 34.0837, lon: 74.7973 },
  "kashmir, india": { lat: 34.0837, lon: 74.7973 },
  leh: { lat: 34.1526, lon: 77.5771 },
  "leh, india": { lat: 34.1526, lon: 77.5771 },
  shimla: { lat: 31.1048, lon: 77.1734 },
  "shimla, india": { lat: 31.1048, lon: 77.1734 },
  darjeeling: { lat: 27.036, lon: 88.2627 },
  "darjeeling, india": { lat: 27.036, lon: 88.2627 },
};

/**
 * Tries multiple location name variations to find coordinates
 */
const tryGeocodeVariations = async (
  locationName: string,
  redisClient: any
): Promise<Coordinates | null> => {
  const variations = [
    locationName,
    locationName.replace(/,?\s*india$/i, "").trim(),
    locationName + (locationName.toLowerCase().includes("india") ? "" : ", India"),
    locationName
      .replace(/,?\s*india$/i, ", Goa, India")
      .replace(/goa,\s*goa/i, "Goa"),
  ];

  const uniqueVariations = [
    ...new Set(variations.map((v) => v.toLowerCase().trim())),
  ];

  for (const variation of uniqueVariations) {
    if (FALLBACK_COORDINATES[variation]) {
      return FALLBACK_COORDINATES[variation];
    }

    try {
      const results = await searchLocation(variation);
      if (results && results.length > 0) {
        return { lat: results[0].lat, lon: results[0].lon };
      }
    } catch (error) {
      continue;
    }
  }

  return null;
};

/**
 * Converts a location name into coordinates using Geoapify, with Redis caching.
 */
export const getCoordinatesForLocation = async (
  locationName: string
): Promise<Coordinates | null> => {
  if (!locationName || typeof locationName !== "string") {
    return null;
  }

  const sanitizedLocation = locationName.trim();
  if (!sanitizedLocation) return null;

  const cacheKey = `geo:${sanitizedLocation
    .toLowerCase()
    .replace(/\s+/g, "_")}`;

  try {
    const redisClient = await ensureRedisConnection();

    // 1. Check cache
    const cachedResult = await redisClient.get(cacheKey);
    if (cachedResult) {
      return JSON.parse(cachedResult);
    }

    // 2. Try variations (includes fallback check and API call)
    const coords = await tryGeocodeVariations(sanitizedLocation, redisClient);

    if (coords) {
      await redisClient.setEx(cacheKey, 2592000, JSON.stringify(coords));
      return coords;
    }

    return null;
  } catch (error) {
    console.error(`Geocoding error for "${sanitizedLocation}":`, error);
    return FALLBACK_COORDINATES[sanitizedLocation.toLowerCase()] || null;
  }
};

