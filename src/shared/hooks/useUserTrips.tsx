// src/shared/hooks/useUserTrips.ts
import { useUserGroups } from "./useUserGroups";

export function useUserTrips() {
  const { groups, loading } = useUserGroups();

  const trips = groups
    .filter((group) => group.group?.trip_dates)
    .map((group) => group.group!.trip_dates);

  return { trips, loading };
}
