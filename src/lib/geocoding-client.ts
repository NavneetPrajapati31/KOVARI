
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

/**
 * Searches for locations using Geoapify Autocomplete API via server proxy.
 * Safe for client-side usage.
 */
export const searchLocation = async (query: string): Promise<GeoapifyResult[]> => {
  try {
    const res = await fetch(`/api/proxy/geocoding?type=autocomplete&q=${encodeURIComponent(query)}`);
    if (!res.ok) {
       console.error(`Geocoding proxy error: ${res.status}`);
       return [];
    }
    const data = await res.json();
    
    // Map features to simplified properties (data format is from Geoapify)
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
    console.error("Geocoding search error:", error);
    return [];
  }
};

/**
 * Gets detailed location data for a place_id via server proxy.
 * Safe for client-side usage.
 */
export const getLocationDetails = async (placeId: string): Promise<LocationData | null> => {
  try {
    const res = await fetch(`/api/proxy/geocoding?type=details&placeId=${encodeURIComponent(placeId)}`);
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
    console.error("Geocoding details error:", error);
    return null;
  }
};
