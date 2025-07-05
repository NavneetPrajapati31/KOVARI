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
    <div className="bg-[#ECEABE] border border-[#B2A890] rounded-xl p-5 shadow-md">
      <h2 className="text-lg font-medium mb-4 text-[#004831]">Trips Per Year</h2>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={barData}>
          <XAxis dataKey="year" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {barData.map((_, index) => (
              <Cell key={`bar-${index}`} fill="#004831" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
