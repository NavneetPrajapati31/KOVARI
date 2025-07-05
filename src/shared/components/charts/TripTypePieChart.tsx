"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import React, { useState, useEffect } from "react";

interface Props {
  solo: number;
  group: number;
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null;
  const { name, value } = payload[0];
  return (
    <div className="bg-background text-foreground border border-border rounded px-3 py-2 shadow">
      <span className="font-medium">{name}:</span> {value}
    </div>
  );
}

export default function TripTypePieChart({ solo, group }: Props) {
  const [colors, setColors] = useState(["#004831", "#9BA186"]); // fallback
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const root = document.documentElement;
      const primary =
        getComputedStyle(root).getPropertyValue("--primary").trim() ||
        "#004831";
      const secondary =
        getComputedStyle(root).getPropertyValue("--secondary").trim() ||
        "#9BA186";
      setColors([primary, secondary]);
    }
  }, []);

  const data = [
    { name: "Solo Trips", value: solo },
    { name: "Group Trips", value: group },
  ];

  return (
    <div className="bg-background border border-border rounded-xl p-5 shadow-md">
      <h2 className="text-lg font-medium mb-4 text-primary">
        Trip Type Distribution
      </h2>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            label
            outerRadius={80}
            dataKey="value"
            nameKey="name"
            onMouseEnter={(_, index) => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={colors[index % colors.length]}
                stroke={index === activeIndex ? "#333" : undefined}
                strokeWidth={index === activeIndex ? 2 : 1}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ color: undefined }} iconType="circle" />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
