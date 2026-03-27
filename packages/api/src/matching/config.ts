/**
 * Matching Preset Configurations
 * These presets control the minimum score threshold and maximum distance
 * for matching algorithms. Admin can select which preset to use via settings.
 */

export interface MatchingPresetConfig {
  minScore: number;
  maxDistanceKm: number;
}

export const MATCHING_PRESETS: Record<string, MatchingPresetConfig> = {
  safe: {
    minScore: 0.35,
    maxDistanceKm: 150,
  },
  balanced: {
    minScore: 0.25,
    maxDistanceKm: 200,
  },
  strict: {
    minScore: 0.45,
    maxDistanceKm: 100,
  },
};

/**
 * Get the matching preset configuration
 * Defaults to 'balanced' if preset not found or invalid
 */
export function getMatchingPresetConfig(
  presetMode: string
): MatchingPresetConfig {
  const normalizedMode = presetMode.toLowerCase();
  return MATCHING_PRESETS[normalizedMode] || MATCHING_PRESETS["balanced"];
}
