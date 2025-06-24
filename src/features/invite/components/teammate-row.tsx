"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { MoreHorizontal, Mail, UserMinus, Settings } from "lucide-react";
import { StatusBadge } from "./status-badge";

interface Teammate {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status: "online" | "away" | "inactive";
  statusDetail?: string;
}

interface TeammateRowProps {
  teammate: Teammate;
}

export function TeammateRow({ teammate }: TeammateRowProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex items-center justify-between py-3 px-1 hover:bg-gray-50 rounded-lg transition-colors min-w-0 gap-2">
      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
        <Avatar className="h-10 w-10">
          <AvatarImage
            src={teammate.avatar || "/placeholder.svg"}
            alt={teammate.name}
          />
          <AvatarFallback className="bg-blue-100 text-blue-700 font-medium text-sm">
            {getInitials(teammate.name)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0 max-w-[200px] sm:max-w-none">
          <p className="font-medium text-gray-900 truncate text-sm sm:text-base">
            {teammate.name}
          </p>
          <p className="text-xs sm:text-sm text-gray-500 truncate">
            {teammate.email}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <StatusBadge
          status={teammate.status}
          statusDetail={teammate.statusDetail}
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-gray-100"
            >
              <MoreHorizontal className="h-4 w-4 text-gray-500" />
              <span className="sr-only">Open menu for {teammate.name}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem>
              <Mail className="mr-2 h-4 w-4" />
              Send Message
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Manage Permissions
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-600 focus:text-red-600">
              <UserMinus className="mr-2 h-4 w-4" />
              Remove from Team
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
