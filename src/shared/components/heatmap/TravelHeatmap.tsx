'use client';
import React from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';

type Props = {
  travelDays: string[]; // Array of ISO date strings
};

export default function TravelHeatmap({ travelDays }: Props) {
  // Convert travelDays to heatmap values
  const values = travelDays.map(date => ({ date, count: 1 }));

  // Set the range for the current year
  const startDate = new Date(new Date().getFullYear(), 0, 1);
  const endDate = new Date(new Date().getFullYear(), 11, 31);

  return (
    <div>
      <h3 className="text-lg font-medium mb-2">Travel Activity Heatmap</h3>
      <CalendarHeatmap
        startDate={startDate}
        endDate={endDate}
        values={values}
        classForValue={(value: { date: string; count: number } | undefined) => {
          if (!value) return 'color-empty';
          if (value.count >= 1) return 'color-github-4';
          return 'color-github-0';
        }}
        tooltipDataAttrs={(value: { date: string; count: number } | undefined) =>
          value && value.date
            ? { 'data-tip': `${value.date}: Traveled` }
            : {}
        }
        showWeekdayLabels
      />
    </div>
  );
}