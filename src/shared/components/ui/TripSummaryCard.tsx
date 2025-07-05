// src/shared/components/ui/TripSummaryCard.tsx
"use client";

import React from "react";

interface Props {
  name: string;
  destination: string;
  from: string;
  to: string;
  tripType: string;
  status: "upcoming" | "past";
}

export default function TripSummaryCard({
  name,
  destination,
  from,
  to,
  tripType,
  status,
}: Props) {
  return (
    <div className="bg-background border border-border rounded-xl p-4 shadow hover:shadow-md transition">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold text-primary">{name}</h3>
        <span
          className={`text-xs px-2 py-1 rounded-full ${
            status === "upcoming"
              ? "bg-green-100 text-green-700"
              : "bg-gray-200 text-gray-600"
          }`}
        >
          {status === "upcoming" ? "Upcoming" : "Completed"}
        </span>
      </div>
      <p className="text-sm text-muted-foreground">📍 {destination}</p>
      <p className="text-sm text-muted-foreground">
        🗓 {from} → {to}
      </p>
      <p className="text-sm text-muted-foreground">👥 {tripType}</p>
    </div>
  );
}
