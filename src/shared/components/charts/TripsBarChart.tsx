"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface Props {
  data: Record<string, number>; // e.g., { "2024": 3, "2025": 5 }
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null;
  const { year, count } = payload[0].payload;
  return (
    <div className="bg-background text-foreground border border-border rounded px-3 py-2 shadow">
      <span className="font-medium">{year}:</span> {count}
    </div>
  );
}

export default function TripsBarChart({ data }: Props) {
  const barData = Object.entries(data).map(([year, count]) => ({
    year,
    count,
  }));

  return (
    <div className="bg-background border border-border rounded-xl p-5 shadow-md">
      <h2 className="text-lg font-medium mb-4 text-primary">Trips Per Year</h2>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={barData}>
          <XAxis dataKey="year" stroke="var(--muted-foreground)" />
          <YAxis allowDecimals={false} stroke="var(--muted-foreground)" />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {barData.map((_, index) => (
              <Cell key={`bar-${index}`} fill="var(--primary)" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
