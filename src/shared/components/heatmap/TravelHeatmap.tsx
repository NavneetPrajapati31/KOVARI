"use client";

import type React from "react";
import { useMemo, useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface TravelActivityHeatmapProps {
  travelDays: string[];
  year?: number;
}

interface DayData {
  date: Date;
  count: number;
  dateString: string;
  weekIndex: number;
  dayOfWeek: number;
}

const TravelActivityHeatmap: React.FC<TravelActivityHeatmapProps> = ({
  travelDays,
  year = new Date().getFullYear(),
}) => {
  const [hoveredDay, setHoveredDay] = useState<DayData | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const { yearData, maxCount, weeks } = useMemo(() => {
    const dateCountMap = new Map<string, number>();
    travelDays.forEach((dateStr) => {
      const count = dateCountMap.get(dateStr) || 0;
      dateCountMap.set(dateStr, count + 1);
    });

    const startDate = new Date(year, 0, 1);
    const firstSunday = new Date(startDate);
    firstSunday.setDate(startDate.getDate() - startDate.getDay());

    const days: DayData[] = [];
    let maxCount = 0;
    const weeksArray: (DayData | null)[][] = [];
    const currentDate = new Date(firstSunday);
    let weekIndex = 0;

    while (currentDate.getFullYear() <= year) {
      const week: (DayData | null)[] = [];

      for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
        const dateString = currentDate.toISOString().split("T")[0];
        const count = dateCountMap.get(dateString) || 0;
        maxCount = Math.max(maxCount, count);

        if (currentDate.getFullYear() === year) {
          const dayData: DayData = {
            date: new Date(currentDate),
            count,
            dateString,
            weekIndex,
            dayOfWeek,
          };
          week.push(dayData);
          days.push(dayData);
        } else {
          week.push(null);
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      weeksArray.push(week);
      weekIndex++;

      if (currentDate.getFullYear() > year && currentDate.getMonth() > 0) break;
    }

    return { yearData: days, maxCount, weeks: weeksArray };
  }, [travelDays, year]);

  const getIntensityClass = (count: number) => {
    if (count === 0 || maxCount === 0)
      return "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700";
    const intensity = count / maxCount;
    if (intensity <= 0.25)
      return "bg-green-100 dark:bg-green-900 border-green-200 dark:border-green-800";
    if (intensity <= 0.5)
      return "bg-green-200 dark:bg-green-800 border-green-300 dark:border-green-700";
    if (intensity <= 0.75)
      return "bg-green-300 dark:bg-green-700 border-green-400 dark:border-green-600";
    return "bg-green-400 dark:bg-green-600 border-green-500 dark:border-green-500";
  };

  const getLegendClass = (level: number) => {
    switch (level) {
      case 1:
        return "bg-green-100 dark:bg-green-900 border-green-200 dark:border-green-800";
      case 2:
        return "bg-green-200 dark:bg-green-800 border-green-300 dark:border-green-700";
      case 3:
        return "bg-green-300 dark:bg-green-700 border-green-400 dark:border-green-600";
      case 4:
        return "bg-green-400 dark:bg-green-600 border-green-500 dark:border-green-500";
      default:
        return "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700";
    }
  };

  const formatDate = (date: Date) =>
    date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const handleMouseEnter = (day: DayData, event: React.MouseEvent) => {
    setHoveredDay(day);
    updateMousePosition(event);
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    updateMousePosition(event);
  };

  const handleMouseLeave = () => {
    setHoveredDay(null);
  };

  const updateMousePosition = (event: React.MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setMousePosition({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      });
    }
  };

  const monthLabels = useMemo(() => {
    const labels: { month: string; weekIndex: number; width: number }[] = [];
    let currentMonth = -1;
    let monthStartWeek = 0;
    let monthWeekCount = 0;

    weeks.forEach((week, weekIndex) => {
      const firstValidDay = week.find((d) => d && d.date.getFullYear() === year);
      if (firstValidDay) {
        const month = firstValidDay.date.getMonth();
        if (month !== currentMonth) {
          if (currentMonth !== -1) {
            labels.push({
              month: new Date(year, currentMonth).toLocaleDateString("en-US", { month: "short" }),
              weekIndex: monthStartWeek,
              width: monthWeekCount,
            });
          }
          currentMonth = month;
          monthStartWeek = weekIndex;
          monthWeekCount = 1;
        } else {
          monthWeekCount++;
        }
      }
    });

    if (currentMonth !== -1) {
      labels.push({
        month: new Date(year, currentMonth).toLocaleDateString("en-US", { month: "short" }),
        weekIndex: monthStartWeek,
        width: monthWeekCount,
      });
    }

    return labels;
  }, [weeks, year]);

  return (
    <Card className="w-full max-w-5xl mx-auto">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl font-bold text-center">Travel Activity</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="relative" ref={containerRef}>
          {/* Month Labels */}
          <div className="flex mb-3 ml-0 relative h-5">
            {monthLabels.map(({ month, weekIndex, width }) => (
              <div
                key={`${month}-${weekIndex}`}
                className="text-sm font-medium text-gray-700 dark:text-gray-300 absolute"
                style={{
                  left: `${weekIndex * 16 + (width * 16) / 2}px`,
                  transform: "translateX(-50%)",
                  width: `${width * 16}px`,
                  textAlign: "center",
                }}
              >
                {month}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="flex">
            <div className="overflow-x-auto">
              <div className="flex gap-1" style={{ minWidth: `${weeks.length * 16}px` }}>
                {weeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col gap-1">
                    {week.map((day, dayIndex) => (
                      <div
                        key={`${weekIndex}-${dayIndex}`}
                        className={`w-3 h-3 rounded-sm border cursor-pointer transition-all duration-200 hover:ring-2 hover:ring-blue-400 hover:ring-opacity-50 ${
                          day ? getIntensityClass(day.count) : "bg-transparent border-transparent"
                        }`}
                        onMouseEnter={(e) => day && handleMouseEnter(day, e)}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tooltip - relative instead of fixed */}
          {hoveredDay && (
            <div
              className="absolute z-50 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm rounded-lg px-3 py-2 pointer-events-none shadow-lg border border-gray-700 dark:border-gray-300"
              style={{
                left: mousePosition.x + 8,
                top: mousePosition.y + 8,
              }}
            >
              <div className="font-semibold">{formatDate(hoveredDay.date)}</div>
              <div className="text-xs opacity-90">{hoveredDay.count > 0 ? "Traveled" : "No travel"}</div>
            </div>
          )}

          {/* Legend */}
          <div className="flex items-center justify-center mt-6">
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map((level) => (
                <div key={level} className={`w-3 h-3 rounded-sm border ${getLegendClass(level)}`} />
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TravelActivityHeatmap;
