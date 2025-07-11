'use client';

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import React, { useState } from 'react';

interface Props {
  solo: number;
  group: number;
}

const COLORS = ['#004831', '#9BA186']; // Solo, Group
const LABELS = ['Solo Trips', 'Group Trips'];

export default function TripTypePieChart({ solo, group }: Props) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const data = [
    { name: 'Solo Trips', value: solo },
    { name: 'Group Trips', value: group },
  ];

  return (
    <div className="bg-[#ECEABE] border border-[#B2A890] rounded-xl p-5 shadow-md">
      <h2 className="text-lg font-medium mb-4 text-[#004831]">
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
                fill={COLORS[index % COLORS.length]}
                stroke={index === activeIndex ? '#333' : undefined}
                strokeWidth={index === activeIndex ? 2 : 1}
              />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
