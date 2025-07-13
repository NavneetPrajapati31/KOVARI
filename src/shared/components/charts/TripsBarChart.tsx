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

interface Props {
  data: Record<string, number>; // e.g., { "2024": 3, "2025": 5 }
}

export default function TripsBarChart({ data }: Props) {
  const barData = Object.entries(data).map(([year, count]) => ({
    year,
    count,
  }));

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-md">
      <span className="font-bold text-black mb-2">Trips Per Year</span>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={barData}>
          <XAxis dataKey="year" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="currentColor" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
