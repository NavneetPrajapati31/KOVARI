import { Group } from "@/shared/hooks/useUserGroups";

// 1. Most Frequent Destination
export function getMostFrequentDestinations(groups: Group[]): string {
  const destinationCount: Record<string, number> = {};

  for (const entry of groups) {
    const destination = entry.group?.destination;
    if (!destination) continue;
    destinationCount[destination] = (destinationCount[destination] || 0) + 1;
  }

  const sorted = Object.entries(destinationCount).sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0] || "N/A";
}

// 2. Total Travel Days
export function getTotalTravelDays(groups: Group[]): number {
  let totalDays = 0;

  for (const entry of groups) {
    const { from, to } = entry.group?.trip_dates || {};
    if (from && to) {
      const start = new Date(from);
      const end = new Date(to);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      if (!isNaN(days)) totalDays += days;
    }
  }

  return totalDays;
}

// 3. Estimated Co-Travelers (based on group count)
export function getUniqueCoTravelers(groups: Group[]): number {
  // Assume each group has avg. 5 people (minus current user)
  return Math.max(0, groups.length * 4);
}

// 4. Trip Types Count
export function getTripTypeStats(groups: Group[]): { solo: number; group: number } {
  let solo = 0;
  let groupTrip = 0;

  for (const entry of groups) {
    const type = entry.group?.trip_type;
    if (type === "solo") solo++;
    if (type === "group") groupTrip++;
  }

  return { solo, group: groupTrip };
}

// 5. Trips per Year (for bar chart)
export function getTripsPerYear(groups: Group[]): Record<string, number> {
  const result: Record<string, number> = {};

  for (const entry of groups) {
    const fromDate = entry.group?.trip_dates?.from;
    if (!fromDate) continue;

    const year = new Date(fromDate).getFullYear().toString();
    result[year] = (result[year] || 0) + 1;
   }

   return result;
}
