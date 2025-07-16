"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useMemo } from "react";

interface Props {
  data: Record<string, number>; // e.g., { "2024": 3, "2025": 5 }
}

export default function TripsBarChart({ data }: Props) {
  // Memoize transformed chart data to avoid re-renders
  const barData = useMemo(() => {
    return Object.entries(data).map(([year, count]) => ({
      year,
      count,
    }));
  }, [data]);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-md h-full flex flex-col justify-between">
      <span className="font-bold text-black mb-4">Trips Per Year</span>

      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={barData}>
            <XAxis dataKey="year" stroke="#888" />
            <YAxis allowDecimals={false} stroke="#888" />
            <Tooltip
              contentStyle={{ backgroundColor: "white", border: "1px solid #ddd" }}
              cursor={{ fill: "#f5f5f5" }}
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="currentColor" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
