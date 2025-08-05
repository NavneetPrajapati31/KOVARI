"use client";

import { Card } from "../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
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

export function GroupCard({ group, className }: GroupCardProps) {
  return (
    <Card
      className={cn(
        "flex flex-row items-center gap-x-2 py-0 bg-white text-black shadow-none border-none",
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
          <AvatarFallback className="bg-white border border-border text-neutral-300">
            {group.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between w-full gap-6">
          <h3 className="font-semibold text-xs truncate">{group.name}</h3>
          <p className="text-xs text-foreground font-medium text-right truncate">
            {group.destination}
          </p>
        </div>
        <div className="flex items-center justify-between mt-0.5 w-full">
          <p className="text-xs text-foreground truncate">
            {group.members} Members
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
