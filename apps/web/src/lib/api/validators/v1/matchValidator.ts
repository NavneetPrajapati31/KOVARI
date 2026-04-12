/**
 * 🛡️ Match Service Validator (v1)
 * Validates the shape of the raw response from the Go Matching Service.
 */
export function validateGoMatchResponse(data: any): boolean {
  if (!data) return false;
  
  // Go service often returns an array or an object depending on the endpoint
  if (Array.isArray(data)) {
    return data.every(item => Boolean(item) && Boolean(item.userId || item.id || item.group || item.groupId));
  }
  
  return !!(data.userId || data.id || data.matches || data.groupId || data.group);
}
