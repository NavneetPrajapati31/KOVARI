import { Filter } from 'bad-words';

// Initialize the filter
const filter = new Filter();

/**
 * Checks if the provided text contains profanity.
 * @param text The string to check.
 * @returns true if profanity is detected, false otherwise.
 */
export function containsProfanity(text: string): boolean {
  if (!text) return false;
  return filter.isProfane(text);
}

/**
 * Validates text against profanity, throwing an error if bad words are found.
 * @param text The string to check.
 * @param fieldName The name of the field being checked (for error messaging).
 * @throws Error if the text contains profanity.
 */
export function assertNoProfanity(text: string | null | undefined, fieldName: string = "Content") {
  if (!text) return;
  if (filter.isProfane(text)) {
    throw new Error(`${fieldName} contains inappropriate language.`);
  }
}
