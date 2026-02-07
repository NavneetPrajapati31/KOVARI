
// -----------------------------------------------------------------------------
//   File: Geocoding Client Service (Geoapify Implementation)
// -----------------------------------------------------------------------------
// Location: /lib/geocoding-client.ts
// Purpose: To abstract the client-safe logic for converting location names.

export interface Coordinates {
  lat: number;
  lon: number;
}

export interface GeoapifyResult {
  place_id: string;
  formatted: string;
  city?: string;
  state?: string;
  country?: string;
  lat: number;
  lon: number;
  address_line1?: string;
  address_line2?: string;
}

export interface LocationData {
  city: string;
  state: string;
  country: string;
  lat: number;
  lon: number;
  formatted: string;
  display_name: string; // for compatibility
  place_id: string;
}

const API_KEY = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY;

/**
 * Searches for locations using Geoapify Autocomplete API.
 * Safe for client-side usage.
 */
export const searchLocation = async (query: string): Promise<GeoapifyResult[]> => {
  if (!API_KEY) {
    console.error("Geoapify API key is missing");
    return [];
  }

  // Build URL with parameters
  const url = new URL("https://api.geoapify.com/v1/geocode/autocomplete");
  url.searchParams.append("text", query);
  url.searchParams.append("apiKey", API_KEY);
  url.searchParams.append("type", "city");
  url.searchParams.append("limit", "5");
  url.searchParams.append("lang", "en");
  // Bias and filter for India as requested
  url.searchParams.append("filter", "countrycode:in");
  url.searchParams.append("bias", "countrycode:in");

  try {
    const res = await fetch(url.toString());
    if (!res.ok) {
       console.error(`Geoapify API error: ${res.status} ${res.statusText}`);
       return [];
    }
    const data = await res.json();
    
    // Map features to simplified properties
    return (data.features || []).map((feature: any) => ({
      place_id: feature.properties.place_id,
      formatted: feature.properties.formatted,
      city: feature.properties.city || feature.properties.town || feature.properties.village || feature.properties.suburb,
      state: feature.properties.state || feature.properties.county,
      country: feature.properties.country,
      lat: feature.properties.lat,
      lon: feature.properties.lon,
      address_line1: feature.properties.address_line1,
      address_line2: feature.properties.address_line2,
    }));
  } catch (error) {
    console.error("Geoapify search error:", error);
    return [];
  }
};

/**
 * Gets detailed location data for a place_id.
 * Safe for client-side usage.
 */
export const getLocationDetails = async (placeId: string): Promise<LocationData | null> => {
  if (!API_KEY) {
    console.error("Geoapify API key is missing");
    return null;
  }

  // Use Geocoding API with ID parameter to be safe.
  const geocodingUrl = new URL("https://api.geoapify.com/v1/geocode/search");
  geocodingUrl.searchParams.append("id", placeId);
  geocodingUrl.searchParams.append("apiKey", API_KEY);

  try {
    const res = await fetch(geocodingUrl.toString());
    if (!res.ok) throw new Error("Failed to fetch location details");
    const data = await res.json();
    const feature = data.features?.[0];

    if (!feature) return null;

    const props = feature.properties;
    const city = props.city || props.town || props.village || props.suburb || "";
    const state = props.state || props.county || "";
    const country = props.country || "";
    
    return {
      city,
      state,
      country,
      lat: props.lat,
      lon: props.lon,
      formatted: props.formatted,
      display_name: props.formatted, 
      place_id: props.place_id,
    };
  } catch (error) {
    console.error("Geoapify details error:", error);
    return null;
  }
};
