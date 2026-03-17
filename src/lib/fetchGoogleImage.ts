// Utility to fetch a tourist-place image URL from Google Images using Custom Search JSON API
// Usage example at the bottom

export interface GoogleImageItem {
  link: string;
  title: string;
  snippet: string;
  image?: {
    contextLink: string;
    height: number;
    width: number;
    byteSize: number;
    thumbnailLink: string;
    thumbnailHeight: number;
    thumbnailWidth: number;
  };
}

export interface GoogleImageSearchResponse {
  items?: GoogleImageItem[];
}

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

/**
 * Fetches a tourist-place image URL from Google Images for a given destination and country via server proxy.
 * @param destination - The destination name (e.g., 'Paris')
 * @param country - The country name (e.g., 'France')
 * @returns The best available image URL, or null if not found
 */
export const fetchGoogleTouristImageUrl = async (
  destination: string,
  country: string
): Promise<string | null> => {
  if (!destination || !country) return null;
  // Use destination, country, and tourist keywords
  const shuffled = TOURIST_KEYWORDS.sort(() => 0.5 - Math.random());
  const selectedKeywords = shuffled.slice(0, 2).join(" ");
  const query = `${destination} ${country} ${selectedKeywords}`;

  try {
    const response = await fetch(`/api/proxy/google-image?q=${encodeURIComponent(query)}`);
    if (!response.ok) {
      return null;
    }
    const data = (await response.json()) as GoogleImageSearchResponse;
    if (!data.items || data.items.length === 0) return null;

    // Filter for tourist place relevance
    const relevantItems = data.items.filter((item) => {
      const text = `${item.title} ${item.snippet}`.toLowerCase();
      return TOURIST_KEYWORDS.some((keyword) => text.includes(keyword));
    });
    const pool = relevantItems.length > 0 ? relevantItems : data.items;
    // Pick a random image from the pool
    const selectedItem = pool[Math.floor(Math.random() * pool.length)];
    return selectedItem.link || null;
  } catch (error) {
    return null;
  }
};

/*
// Example usage in a React component (browser):
import { fetchGoogleTouristImageUrl } from '../lib/fetchGoogleImage';

const getImage = async () => {
  // Now handled via server proxy, no key needed in frontend
  const url = await fetchGoogleTouristImageUrl('Paris', 'France');
  console.log(url);
};
*/
