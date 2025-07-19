import { Group } from "@/shared/hooks/useUserGroups";
import { isAfter, isBefore, parseISO } from "date-fns";

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
    const startDate = entry.group?.start_date;
    const endDate = entry.group?.end_date;
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const days = Math.ceil(
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      );
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

// 4. Trip Types Count (based on group size)
export function getTripTypeStats(groups: Group[]): {
  solo: number;
  group: number;
} {
  let solo = 0;
  let groupTrip = 0;

  for (const entry of groups) {
    const membersCount = entry.group?.members_count || 1;
    if (membersCount === 1) {
      solo++;
    } else {
      groupTrip++;
    }
  }

  return { solo, group: groupTrip };
}

// 5. Trips per Year (for bar chart)
export function getTripsPerYear(groups: Group[]): Record<string, number> {
  const result: Record<string, number> = {};

  for (const entry of groups) {
    const startDate = entry.group?.start_date;
    if (!startDate) continue;

    const year = new Date(startDate).getFullYear().toString();
    result[year] = (result[year] || 0) + 1;
  }

  return result;
}

export function getUpcomingTrips(groups: Group[]) {
  const now = new Date();

  return groups.filter((entry) => {
    if (!entry.group?.start_date) return false;

    const tripStartDate = parseISO(entry.group.start_date);
    return isAfter(tripStartDate, now);
  });
}

export function getPastTrips(groups: Group[]) {
  const now = new Date();

  return groups.filter((entry) => {
    if (!entry.group?.start_date) return false;

    const tripStartDate = parseISO(entry.group.start_date);
    return isBefore(tripStartDate, now);
  });
}

export function getTripStats(groups: Group[]) {
  const upcomingTrips = getUpcomingTrips(groups);
  const pastTrips = getPastTrips(groups);

  return {
    total: groups.length,
    upcoming: upcomingTrips.length,
    past: pastTrips.length,
  };
}

export function getDestinationStats(groups: Group[]) {
  const destinationCounts: Record<string, number> = {};

  groups.forEach((entry) => {
    if (entry.group?.destination) {
      const destination = entry.group.destination;
      destinationCounts[destination] =
        (destinationCounts[destination] || 0) + 1;
    }
  });

  return Object.entries(destinationCounts)
    .map(([destination, count]) => ({ destination, count }))
    .sort((a, b) => b.count - a.count);
}