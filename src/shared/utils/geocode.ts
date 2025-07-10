// Replace with real geocoding later using a library or API (e.g., OpenCage, Mapbox)
export const getLatLngFromDestination = (destination: string): [number, number] => {
    const map: Record<string, [number, number]> = {
      Paris: [48.8566, 2.3522],
      Tokyo: [35.6762, 139.6503],
      Surat: [21.1702, 72.8311],
      Amsterdam: [52.3676, 4.9041],
      Delhi: [28.6139, 77.209],
      // Add more as needed
    };
  
    return map[destination] || [20, 78]; // default to India
  };
  