// src/shared/hooks/useUserTrips.ts
import { useUserGroups } from "./useUserGroups";

export function useUserTrips() {
  const { groups } = useUserGroups();

  const trips = groups
    .filter((group) => group.group?.start_date && group.group?.end_date)
    .map((group) => ({
      from: group.group!.start_date,
      to: group.group!.end_date,
    }));

  return { trips };
}
