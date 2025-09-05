// -----------------------------------------------------------------------------
//   File 2: Geocoding Service (Production Implementation with OpenStreetMap)
// -----------------------------------------------------------------------------
// Location: /lib/geocoding.ts
// Purpose: To abstract the logic for converting location names into coordinates.

import redis, { ensureRedisConnection } from './redis';

interface Coordinates {
    lat: number;
    lon: number;
}

/**
 * Converts a location name into coordinates using OpenStreetMap Nominatim, with caching.
 * @param locationName The name of the location.
 * @returns A promise that resolves to an object with lat and lon, or null.
 */
export const getCoordinatesForLocation = async (locationName: string): Promise<Coordinates | null> => {
    const cacheKey = `geo:${locationName.toLowerCase().replace(/\s/g, '_')}`;
    
    try {
        // 1. Ensure Redis is connected
        const redisClient = await ensureRedisConnection();
        
        // 2. Check cache first
        const cachedResult = await redisClient.get(cacheKey);
        if (cachedResult) {
            console.log(`Geocoding (Cache HIT): Found coordinates for ${locationName}`);
            return JSON.parse(cachedResult);
        }

        console.log(`Geocoding (Cache MISS): Looking up coordinates for ${locationName} with OpenStreetMap`);

        // 2. If not in cache, call the OpenStreetMap Nominatim API
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationName)}&format=json&limit=1`;

        const response = await fetch(url, {
            headers: {
                // IMPORTANT: OSM requires a custom User-Agent to identify your application.
                'User-Agent': 'Kovari Social Travel App/1.0 (your-contact-email@example.com)'
            }
        });

        if (!response.ok) {
            console.error(`Nominatim API failed with status ${response.status}: ${await response.text()}`);
            return null;
        }

        const data = await response.json();

        // 3. Parse the result and cache it
        if (data && data.length > 0) {
            const coords: Coordinates = {
                lat: parseFloat(data[0].lat),
                lon: parseFloat(data[0].lon),
            };

            // FIX: Use setEx (Redis v4+) instead of setex (deprecated)
            await redisClient.setEx(cacheKey, 2592000, JSON.stringify(coords)); // 2592000 seconds = 30 days
            
            return coords;
        } else {
            // Location not found by the API
            console.warn(`Geocoding: No results found for ${locationName}`);
            return null;
        }

    } catch (error) {
        // Handle network errors or other exceptions
        console.error("An error occurred during geocoding:", error);
        return null;
    }
};