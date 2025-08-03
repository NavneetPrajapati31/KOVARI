// -----------------------------------------------------------------------------
//   File 2: Geocoding Service (Production Implementation with OpenStreetMap)
// -----------------------------------------------------------------------------
// Location: /lib/geocoding.ts
// Purpose: To abstract the logic for converting location names into coordinates.

import redis from './redis';

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
        // 1. Check cache first
        const cachedResult = await redis.get(cacheKey);
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

            // Cache the result for 30 days (2592000 seconds)
            await redis.set(cacheKey, JSON.stringify(coords), { EX: 2592000 });
            
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

/**
 * Gets the user's current location coordinates using browser geolocation API.
 * This is used for finding users from the same region.
 * @returns A promise that resolves to coordinates or null if not available.
 */
export const getUserLocationCoordinates = async (): Promise<Coordinates | null> => {
    if (typeof window === 'undefined') {
        // Server-side rendering - return null
        return null;
    }

    if (!navigator.geolocation) {
        console.warn('Geolocation is not supported by this browser');
        return null;
    }

    try {
        return new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        lat: position.coords.latitude,
                        lon: position.coords.longitude
                    });
                },
                (error) => {
                    console.warn('Error getting user location:', error.message);
                    resolve(null);
                },
                {
                    enableHighAccuracy: false,
                    timeout: 10000,
                    maximumAge: 300000 // 5 minutes cache
                }
            );
        });
    } catch (error) {
        console.error('Error in getUserLocationCoordinates:', error);
        return null;
    }
};