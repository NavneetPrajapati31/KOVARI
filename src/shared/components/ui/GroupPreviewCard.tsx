import React from "react";
import Link from "next/link";
import { Group } from "@/shared/hooks/useUserGroups";

interface Props {
  group: Group;
}

export default function GroupPreviewCard({ group }: Props) {
  if (!group.group) return null;

  const { name, destination, trip_dates } = group.group;

  return (
    <div className="bg-[#ECEABE] border border-[#B2A890] rounded-xl p-4 shadow-sm hover:shadow-md transition">
      <h3 className="text-xl font-semibold text-[#004831]">{name}</h3>
      <p className="text-sm text-[#2b2b1f] mt-1">{destination}</p>
      <p className="text-sm text-[#5C6249] mt-1">
        {trip_dates.from} → {trip_dates.to}
      </p>
      <Link href={`/groups/${group.group_id}`}>
        <button className="mt-3 px-4 py-1 rounded-md text-sm bg-primary text-white hover:bg-primary-hover transition">
          View Details
        </button>
      </Link>
    </div>
  );
}
