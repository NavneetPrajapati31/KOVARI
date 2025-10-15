"use client";

import React from "react";
import { Card } from "@/shared/components/ui/card";
import { Calendar, TrendingUp, MapPin } from "lucide-react";

interface TravelDaysCardProps {
  totalDays: number;
  loading?: boolean;
  className?: string;
}

export const TravelDaysCard: React.FC<TravelDaysCardProps> = ({
  totalDays,
  loading = false,
  className = "",
}) => {
  if (loading) {
    return (
      <Card
        className={`w-[260px] h-[180px] rounded-xl animate-pulse bg-muted ${className}`}
      >
        <div className="h-full flex items-center justify-center">
          <div className="w-8 h-8 bg-muted-foreground/20 rounded-full" />
        </div>
      </Card>
    );
  }

  return (
    <Card
      className={`w-[260px] h-[180px] rounded-xl overflow-hidden relative group cursor-pointer transition-all duration-300 hover:shadow-lg ${className}`}
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-indigo-500/20" />

      {/* Content */}
      <div className="relative z-10 h-full p-6 flex flex-col justify-between">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Travel Days
              </p>
              <p className="text-xs text-muted-foreground/70">Total count</p>
            </div>
          </div>
          <TrendingUp className="w-5 h-5 text-green-500" />
        </div>

        {/* Main content */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl font-bold text-foreground mb-1">
              {totalDays}
            </div>
            <div className="text-sm text-muted-foreground">
              {totalDays === 1 ? "Day" : "Days"}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MapPin className="w-3 h-3" />
          <span>Across all trips</span>
        </div>
      </div>

      {/* Hover effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </Card>
  );
};
