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

// Rate limiting: Nominatim allows max 1 request per second per application
const RATE_LIMIT_KEY = 'nominatim:last_request_time';
const MIN_REQUEST_INTERVAL_MS = 1000; // 1 second minimum between requests

/**
 * Enforces rate limiting for Nominatim API requests (max 1 request per second)
 */
async function enforceRateLimit(): Promise<void> {
    try {
        const redisClient = await ensureRedisConnection();
        const lastRequestTime = await redisClient.get(RATE_LIMIT_KEY);
        
        if (lastRequestTime) {
            const timeSinceLastRequest = Date.now() - parseInt(lastRequestTime, 10);
            const remainingWaitTime = MIN_REQUEST_INTERVAL_MS - timeSinceLastRequest;
            
            if (remainingWaitTime > 0) {
                console.log(`Geocoding: Rate limiting - waiting ${remainingWaitTime}ms before next request`);
                await new Promise(resolve => setTimeout(resolve, remainingWaitTime));
            }
        }
        
        // Update last request time
        await redisClient.set(RATE_LIMIT_KEY, Date.now().toString());
    } catch (error) {
        // If rate limiting fails, still wait the minimum time to be safe
        console.warn('Geocoding: Rate limit tracking failed, using default delay:', error);
        await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL_MS));
    }
}

/**
 * Gets the User-Agent string for Nominatim API requests
 * Nominatim requires a proper User-Agent that identifies the application
 */
function getUserAgent(): string {
    const contactEmail = process.env.NOMINATIM_CONTACT_EMAIL || 'contact@kovari.app';
    const appName = process.env.NOMINATIM_APP_NAME || 'Kovari Social Travel App';
    const appVersion = process.env.NOMINATIM_APP_VERSION || '1.0';
    return `${appName}/${appVersion} (${contactEmail})`;
}

/**
 * Converts a location name into coordinates using OpenStreetMap Nominatim, with caching.
 * @param locationName The name of the location.
 * @returns A promise that resolves to an object with lat and lon, or null.
 */
export const getCoordinatesForLocation = async (locationName: string): Promise<Coordinates | null> => {
    // Validate and sanitize input
    if (!locationName || typeof locationName !== 'string') {
        console.error("Geocoding: Invalid location name provided:", locationName);
        return null;
    }

    const sanitizedLocation = locationName.trim();
    if (!sanitizedLocation) {
        console.error("Geocoding: Empty location name provided");
        return null;
    }

    const cacheKey = `geo:${sanitizedLocation.toLowerCase().replace(/\s+/g, '_')}`;
    
    try {
        // 1. Ensure Redis is connected
        const redisClient = await ensureRedisConnection();
        
        // 2. Check cache first
        const cachedResult = await redisClient.get(cacheKey);
        if (cachedResult) {
            console.log(`Geocoding (Cache HIT): Found coordinates for "${sanitizedLocation}"`);
            return JSON.parse(cachedResult);
        }

        console.log(`Geocoding (Cache MISS): Looking up coordinates for "${sanitizedLocation}" with OpenStreetMap`);

        // 3. If not in cache, call the OpenStreetMap Nominatim API
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(sanitizedLocation)}&format=json&limit=1`;

        const response = await fetch(url, {
            headers: {
                // IMPORTANT: OSM requires a custom User-Agent to identify your application.
                'User-Agent': getUserAgent(),
                'Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://kovari.app',
                'Accept': 'application/json',
                'Accept-Language': 'en-US,en;q=0.9',
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Nominatim API failed for "${sanitizedLocation}" with status ${response.status}: ${errorText}`);
            return null;
        }

        const data = await response.json();

        // 4. Parse the result and cache it
        if (data && Array.isArray(data) && data.length > 0) {
            const lat = parseFloat(data[0].lat);
            const lon = parseFloat(data[0].lon);

            // Validate coordinates
            if (isNaN(lat) || isNaN(lon)) {
                console.error(`Geocoding: Invalid coordinates returned for "${sanitizedLocation}": lat=${data[0].lat}, lon=${data[0].lon}`);
                return null;
            }

            const coords: Coordinates = { lat, lon };

            // FIX: Use setEx (Redis v4+) instead of setex (deprecated)
            await redisClient.setEx(cacheKey, 2592000, JSON.stringify(coords)); // 2592000 seconds = 30 days
            
            console.log(`Geocoding: Successfully found coordinates for "${sanitizedLocation}": ${lat}, ${lon}`);
            return coords;
        } else {
            // Location not found by the API
            console.warn(`Geocoding: No results found for "${sanitizedLocation}". The location may be misspelled or not exist in OpenStreetMap.`);
            return null;
        }

    } catch (error) {
        // Handle network errors or other exceptions
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Geocoding error for "${sanitizedLocation}":`, errorMessage);
        return null;
    }
};