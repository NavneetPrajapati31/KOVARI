export type Group = {
  group_id: string;
  group: {
    name: string;
    destination: string;
    trip_dates: {
      from: string;
      to: string;
    };
  } | null;
};

export function getMostFrequentDestinations(groups: Group[]) {
  const counter: Record<string, number> = {};
  for (const g of groups) {
    const destination = g.group?.destination;
    if (destination) counter[destination] = (counter[destination] || 0) + 1;
  }

  const sorted = Object.entries(counter).sort((a, b) => b[1] - a[1]);
  return sorted.length > 0 ? sorted[0][0] : "N/A";
}

export function getTotalTravelDays(groups: Group[]) {
  let total = 0;
  for (const g of groups) {
    const { from, to } = g.group?.trip_dates || {};
    if (from && to) {
      const start = new Date(from);
      const end = new Date(to);
      const diffDays = Math.ceil((+end - +start) / (1000 * 60 * 60 * 24));
      if (diffDays > 0) total += diffDays;
    }
  }
  return total;
}

export function getUniqueCoTravelers(groups: Group[]) {
  const memberCounts = groups.length * 5; // Approximate (replace with real logic if you join members)
  return memberCounts || 0;
}
