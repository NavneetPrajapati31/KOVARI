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
// Fallback coordinates for common Indian destinations
const FALLBACK_COORDINATES: Record<string, Coordinates> = {
    'goa': { lat: 15.2993, lon: 74.1240 },
    'goa, india': { lat: 15.2993, lon: 74.1240 },
    'goa, goa': { lat: 15.2993, lon: 74.1240 },
    'mumbai': { lat: 19.0760, lon: 72.8777 },
    'mumbai, india': { lat: 19.0760, lon: 72.8777 },
    'mumbai, maharashtra': { lat: 19.0760, lon: 72.8777 },
    'mumbai, maharashtra, india': { lat: 19.0760, lon: 72.8777 },
    'delhi': { lat: 28.7041, lon: 77.1025 },
    'delhi, india': { lat: 28.7041, lon: 77.1025 },
    'delhi, delhi': { lat: 28.7041, lon: 77.1025 },
    'new delhi': { lat: 28.6139, lon: 77.2090 },
    'new delhi, india': { lat: 28.6139, lon: 77.2090 },
    'new delhi, delhi': { lat: 28.6139, lon: 77.2090 },
    'manali': { lat: 32.2432, lon: 77.1892 },
    'manali, india': { lat: 32.2432, lon: 77.1892 },
    'rishikesh': { lat: 30.0869, lon: 78.2676 },
    'rishikesh, india': { lat: 30.0869, lon: 78.2676 },
    'bangalore': { lat: 12.9716, lon: 77.5946 },
    'bangalore, india': { lat: 12.9716, lon: 77.5946 },
    'bengaluru': { lat: 12.9716, lon: 77.5946 },
    'bengaluru, india': { lat: 12.9716, lon: 77.5946 },
    'hyderabad': { lat: 17.3850, lon: 78.4867 },
    'hyderabad, india': { lat: 17.3850, lon: 78.4867 },
    'chennai': { lat: 13.0827, lon: 80.2707 },
    'chennai, india': { lat: 13.0827, lon: 80.2707 },
    'kolkata': { lat: 22.5726, lon: 88.3639 },
    'kolkata, india': { lat: 22.5726, lon: 88.3639 },
    'pune': { lat: 18.5204, lon: 73.8567 },
    'pune, india': { lat: 18.5204, lon: 73.8567 },
    'jaipur': { lat: 26.9124, lon: 75.7873 },
    'jaipur, india': { lat: 26.9124, lon: 75.7873 },
    'udaipur': { lat: 24.5854, lon: 73.7125 },
    'udaipur, india': { lat: 24.5854, lon: 73.7125 },
    'kerala': { lat: 10.1632, lon: 76.6413 },
    'kerala, india': { lat: 10.1632, lon: 76.6413 },
    'kashmir': { lat: 34.0837, lon: 74.7973 },
    'kashmir, india': { lat: 34.0837, lon: 74.7973 },
    'leh': { lat: 34.1526, lon: 77.5771 },
    'leh, india': { lat: 34.1526, lon: 77.5771 },
    'shimla': { lat: 31.1048, lon: 77.1734 },
    'shimla, india': { lat: 31.1048, lon: 77.1734 },
    'darjeeling': { lat: 27.0360, lon: 88.2627 },
    'darjeeling, india': { lat: 27.0360, lon: 88.2627 },
};

/**
 * Tries multiple location name variations to find coordinates
 */
const tryGeocodeVariations = async (
    locationName: string,
    redisClient: any
): Promise<Coordinates | null> => {
    // Generate variations to try
    const variations = [
        locationName, // Original
        locationName.replace(/,?\s*india$/i, '').trim(), // Remove ", India" suffix
        locationName + (locationName.toLowerCase().includes('india') ? '' : ', India'), // Add ", India" if not present
        locationName.replace(/,?\s*india$/i, ', Goa, India').replace(/goa,\s*goa/i, 'Goa'), // For Goa specifically
    ];

    // Remove duplicates
    const uniqueVariations = [...new Set(variations.map(v => v.toLowerCase().trim()))];

    for (const variation of uniqueVariations) {
        // Check fallback first
        const fallbackKey = variation.toLowerCase();
        if (FALLBACK_COORDINATES[fallbackKey]) {
            console.log(`Geocoding (Fallback): Using known coordinates for "${variation}"`);
            return FALLBACK_COORDINATES[fallbackKey];
        }

        // Try OpenStreetMap API
        const cacheKey = `geo:${variation.toLowerCase().replace(/\s+/g, '_')}`;
        
        // Check cache
        const cachedResult = await redisClient.get(cacheKey);
        if (cachedResult) {
            console.log(`Geocoding (Cache HIT): Found coordinates for "${variation}"`);
            return JSON.parse(cachedResult);
        }

        // Try API
        try {
            const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(variation)}&format=json&limit=1&countrycodes=in`;
            
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Kovari Social Travel App/1.0 (your-contact-email@example.com)'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data && Array.isArray(data) && data.length > 0) {
                    const lat = parseFloat(data[0].lat);
                    const lon = parseFloat(data[0].lon);

                    if (!isNaN(lat) && !isNaN(lon)) {
                        const coords: Coordinates = { lat, lon };
                        await redisClient.setEx(cacheKey, 2592000, JSON.stringify(coords));
                        console.log(`Geocoding: Successfully found coordinates for "${variation}": ${lat}, ${lon}`);
                        return coords;
                    }
                }
            }
        } catch (error) {
            // Continue to next variation
            continue;
        }
    }

    return null;
};

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

    try {
        // 1. Ensure Redis is connected
        const redisClient = await ensureRedisConnection();
        
        // 2. Check fallback coordinates first (fastest)
        // Try multiple variations: exact match, without state, with state, with country
        const fallbackVariations = [
            sanitizedLocation.toLowerCase(),
            sanitizedLocation.toLowerCase().replace(/,?\s*[^,]+,\s*[^,]+$/i, ''), // Remove state, country
            sanitizedLocation.toLowerCase().replace(/,?\s*india$/i, ''), // Remove country
            sanitizedLocation.toLowerCase().replace(/,?\s*[^,]+$/i, ''), // Remove last part (state or country)
        ];
        
        for (const variation of fallbackVariations) {
            const trimmed = variation.trim();
            if (FALLBACK_COORDINATES[trimmed]) {
                console.log(`Geocoding (Fallback): Using known coordinates for "${sanitizedLocation}" (matched: "${trimmed}")`);
                return FALLBACK_COORDINATES[trimmed];
            }
        }

        // 3. Check cache
        const cacheKey = `geo:${sanitizedLocation.toLowerCase().replace(/\s+/g, '_')}`;
        const cachedResult = await redisClient.get(cacheKey);
        if (cachedResult) {
            console.log(`Geocoding (Cache HIT): Found coordinates for "${sanitizedLocation}"`);
            return JSON.parse(cachedResult);
        }

        console.log(`Geocoding (Cache MISS): Looking up coordinates for "${sanitizedLocation}"`);

        // 4. Try geocoding with variations
        const coords = await tryGeocodeVariations(sanitizedLocation, redisClient);
        
        if (coords) {
            // Cache the result with original location name
            await redisClient.setEx(cacheKey, 2592000, JSON.stringify(coords));
            return coords;
        }

        // 5. If all variations failed, return null
        console.warn(`Geocoding: No results found for "${sanitizedLocation}" after trying all variations.`);
        return null;

    } catch (error) {
        // Handle network errors or other exceptions
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Geocoding error for "${sanitizedLocation}":`, errorMessage);
        
        // Last resort: check fallback
        const fallbackKey = sanitizedLocation.toLowerCase();
        if (FALLBACK_COORDINATES[fallbackKey]) {
            console.log(`Geocoding (Fallback - Error Recovery): Using known coordinates for "${sanitizedLocation}"`);
            return FALLBACK_COORDINATES[fallbackKey];
        }
        
        return null;
    }
};