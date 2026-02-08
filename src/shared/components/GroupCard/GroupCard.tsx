"use client";

import { Card } from "../ui/card";
import { Avatar, AvatarImage } from "../ui/avatar";
import { UserAvatarFallback } from "../UserAvatarFallback";
import { cn } from "../../utils/utils";
import { Separator } from "../ui/separator";

interface GroupCardProps {
  group: {
    id: string;
    name: string;
    members: number;
    destination: string;
    imageUrl?: string;
    timestampOrTag?: string; // e.g. date or frequency
  };
  className?: string;
}

/** Returns only the city name (first segment before comma); no state, province or country. */
function getCityOnly(destination: string): string {
  const city = destination.split(",")[0]?.trim();
  return city ?? destination;
}

export function GroupCard({ group, className }: GroupCardProps) {
  const cityName = getCityOnly(group.destination);

  return (
    <Card
      className={cn(
        "flex flex-row items-center gap-x-2 px-4 bg-card text-foreground shadow-none border-none",
        className
      )}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        <Avatar className="h-10 w-10">
          <AvatarImage
            src={group.imageUrl || "/placeholder.svg"}
            alt={group.name}
          />
        <UserAvatarFallback className="" />
        </Avatar>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between w-full gap-6">
          <h3 className="font-semibold text-xs truncate">{group.name}</h3>
          <p className="text-xs text-foreground font-medium text-right whitespace-nowrap capitalize">
            {cityName}
          </p>
        </div>
        <div className="flex items-center justify-between mt-0.5 w-full">
          <p className="text-xs text-muted-foreground truncate">
            {group.members === 1 ? "1 member" : `${group.members} members`}
          </p>
          {/* {group.timestampOrTag && (
            <p className="text-sm text-black text-right truncate">
              {group.timestampOrTag}
            </p>
          )} */}
        </div>
      </div>
    </Card>
  );
}
