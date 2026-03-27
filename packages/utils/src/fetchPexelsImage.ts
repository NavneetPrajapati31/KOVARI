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
 * Fetches a top square image URL from Pexels for a given destination and country via server proxy.
 * @param destination - The destination name (e.g., 'Paris')
 * @param country - The country name (e.g., 'France')
 * @returns The best available square image URL, or null if not found
 */
export const fetchPexelsSquareImageUrl = async (
  destination: string,
  country: string
): Promise<string | null> => {
  if (!destination || !country) return null;
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

  try {
    const response = await fetch(`/api/proxy/pexels?q=${encodeURIComponent(query)}`);
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

const getImage = async () => {
  // Now handled via server proxy, no key needed in frontend
  const url = await fetchPexelsSquareImageUrl('Paris', 'France');
  console.log(url);
};
*/

