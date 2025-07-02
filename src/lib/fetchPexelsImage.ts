// Utility to fetch a square image URL from Pexels for a given destination and country
// Usage example at the bottom

export interface PexelsPhotoSrc {
  original: string;
  large2x: string;
  large: string;
  medium: string;
  small: string;
  portrait: string;
  landscape: string;
  tiny: string;
}

export interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  photographer_id: number;
  avg_color: string | null;
  src: PexelsPhotoSrc;
  liked: boolean;
  alt: string;
}

export interface PexelsSearchResponse {
  total_results: number;
  page: number;
  per_page: number;
  photos: PexelsPhoto[];
  next_page?: string;
}

/**
 * Fetches a top square image URL from Pexels for a given destination and country.
 * @param destination - The destination name (e.g., 'Paris')
 * @param country - The country name (e.g., 'France')
 * @param apiKey - Pexels API key (browser-safe, use env var for public key)
 * @returns The best available square image URL, or null if not found
 */
export const fetchPexelsSquareImageUrl = async (
  destination: string,
  country: string,
  apiKey: string
): Promise<string | null> => {
  if (!destination || !country || !apiKey) return null;
  // Tourist-specific keywords
  const TOURIST_KEYWORDS = [
    "tourist attraction",
    "landmark",
    "monument",
    "sightseeing",
    "famous place",
    "must see",
    "iconic",
    "historic site",
    "tourist spot",
    "attraction",
    "point of interest",
    "sight",
    "heritage",
    "museum",
    "castle",
    "palace",
    "temple",
    "cathedral",
    "bridge",
    "tower",
    "plaza",
    "square",
    "park",
    "statue",
  ];
  // Pick two random keywords for this search
  const shuffled = TOURIST_KEYWORDS.sort(() => 0.5 - Math.random());
  const selectedKeywords = shuffled.slice(0, 2).join(" ");
  const query = `${destination} ${country} ${selectedKeywords}`;
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(
    query
  )}&orientation=square&per_page=20&page=1`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: apiKey,
      },
    });
    if (!response.ok) {
      return null;
    }
    const data = (await response.json()) as PexelsSearchResponse;
    if (!data.photos || data.photos.length === 0) return null;

    // Filter for tourist place relevance
    const relevantPhotos = data.photos.filter((photo) => {
      const text =
        `${photo.alt} ${photo.url} ${photo.photographer}`.toLowerCase();
      return TOURIST_KEYWORDS.some((keyword) => text.includes(keyword));
    });
    const pool = relevantPhotos.length > 0 ? relevantPhotos : data.photos;
    // Pick a random image from the pool
    const selectedPhoto = pool[Math.floor(Math.random() * pool.length)];
    return (
      selectedPhoto.src.original ||
      selectedPhoto.src.large ||
      selectedPhoto.src.medium ||
      null
    );
  } catch (error) {
    return null;
  }
};

/*
// Example usage in a React component (browser):
import { fetchPexelsSquareImageUrl } from '../lib/fetchPexelsImage';

const apiKey = process.env.NEXT_PUBLIC_PEXELS_API_KEY!;

const getImage = async () => {
  const url = await fetchPexelsSquareImageUrl('Paris', 'France', apiKey);
  console.log(url);
};
*/
