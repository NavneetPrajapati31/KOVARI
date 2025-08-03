"use client";

import React from "react";
import { Card, CardHeader } from "@/shared/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";

// Type definitions
interface HeatmapDataPoint {
  date: string;
  count: number;
}

interface DayData {
  date: Date;
  count: number;
  dayOfWeek: number;
  month: number;
  year: number;
}

interface WeekColumn {
  days: (DayData | null)[];
  month: number;
  monthName: string;
  weekIndex: number;
  isFirstWeekOfMonth: boolean;
}

interface MonthBlock {
  month: number;
  year: number;
  name: string;
  weekColumns: WeekColumn[];
}

interface HeatmapProps {
  data: HeatmapDataPoint[];
}

interface HeatmapData {
  weekColumns: WeekColumn[];
  months: { name: string; month: number }[];
  totalSubmissions: number;
  totalActiveDays: number;
  maxStreak: number;
}

// Helper to get month short name
const getMonthName = (monthIndex: number): string =>
  [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ][monthIndex];

// Helper to get color class for a day
const getDayColor = (count: number): string => {
  if (count === 0) return "bg-gh-heatmap-inactive";
  if (count >= 1 && count <= 5) return "bg-gh-heatmap-green-1";
  if (count >= 6 && count <= 10) return "bg-gh-heatmap-green-2";
  if (count >= 11 && count <= 20) return "bg-gh-heatmap-green-3";
  return "bg-gh-heatmap-green-4";
};

const generateHeatmapData = (externalData: HeatmapDataPoint[]): HeatmapData => {
  // --- Ensure today is present in the data ---
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let data = Array.isArray(externalData) ? [...externalData] : [];
  const hasToday = data.some((d) => {
    const dDate = new Date(d.date);
    dDate.setHours(0, 0, 0, 0);
    return dDate.getTime() === today.getTime();
  });
  if (!hasToday) {
    data.push({ date: today.toISOString().split("T")[0], count: 0 });
  }
  // --- End ensure today is present ---

  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 364);

  // Generate all days in our range
  const allDays: DayData[] = [];
  let totalSubmissions = 0;
  let totalActiveDays = 0;
  let maxStreak = 0;
  let currentStreak = 0;
  let lastActive = false;

  let date = new Date(startDate);
  let dataMap: Record<string, number> = {};
  if (data.length > 0) {
    data.forEach(({ date, count }) => {
      dataMap[date] = count;
    });
  }
  while (date <= today) {
    let count = 0;
    if (data.length > 0) {
      const dateStr =
        date.getFullYear() +
        "-" +
        String(date.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(date.getDate()).padStart(2, "0");
      count = dataMap[dateStr] || 0;
    } else {
      count = 0;
    }
    allDays.push({
      date: new Date(date),
      count,
      dayOfWeek: date.getDay(),
      month: date.getMonth(),
      year: date.getFullYear(),
    });
    totalSubmissions += count;
    if (count > 0) {
      totalActiveDays++;
      currentStreak = lastActive ? currentStreak + 1 : 1;
      lastActive = true;
    } else {
      currentStreak = 0;
      lastActive = false;
    }
    if (currentStreak > maxStreak) maxStreak = currentStreak;
    date.setDate(date.getDate() + 1);
  }

  // Group days by month and create week columns for each month
  const monthGroups = new Map<string, DayData[]>();
  allDays.forEach((day) => {
    const monthKey = day.month + "-" + day.year;
    if (!monthGroups.has(monthKey)) {
      monthGroups.set(monthKey, []);
    }
    monthGroups.get(monthKey)!.push(day);
  });

  // Convert to ordered array of months
  const months = Array.from(monthGroups.entries())
    .sort(([a], [b]) => {
      // Handle year wrap-around
      const aDate = allDays.find((d) => d.month + "-" + d.year === a)!.date;
      const bDate = allDays.find((d) => d.month + "-" + d.year === b)!.date;
      return aDate.getTime() - bDate.getTime();
    })
    .map(([monthKey, days]) => {
      const [monthIndex, year] = monthKey.split("-").map(Number);
      return {
        month: monthIndex,
        year,
        name: getMonthName(monthIndex),
        days: days.sort((a, b) => a.date.getTime() - b.date.getTime()),
      };
    });

  // Create week columns for each month
  const weekColumns: WeekColumn[] = [];
  let globalWeekIndex = 0;
  months.forEach((monthData, monthIndex) => {
    const monthDays = monthData.days;
    if (monthDays.length === 0) return;
    // Determine starting day of week position
    let startDayOfWeek = 0;
    if (monthIndex > 0) {
      // For subsequent months, continue from where the previous month left off
      const prevMonth = months[monthIndex - 1];
      const lastDayOfPrevMonth = prevMonth.days[prevMonth.days.length - 1];
      startDayOfWeek = (lastDayOfPrevMonth.dayOfWeek + 1) % 7;
    } else {
      // For the first month, start from the actual day of week of the first day
      startDayOfWeek = monthDays[0].dayOfWeek;
    }
    let currentColumn: (DayData | null)[] = [];
    let currentDayPosition = startDayOfWeek;
    let dayIndex = 0;
    // Fill the month's days into week columns
    while (dayIndex < monthDays.length) {
      // Fill current column up to position where we need to place the next day
      while (
        currentColumn.length < currentDayPosition &&
        currentColumn.length < 7
      ) {
        currentColumn.push(null); // Empty slot
      }
      // Add the actual day if we have space in this column
      if (currentColumn.length < 7) {
        currentColumn.push(monthDays[dayIndex]);
        dayIndex++;
        currentDayPosition++;
      }
      // If column is full or we've placed all days, finalize this column
      if (currentColumn.length === 7 || dayIndex === monthDays.length) {
        // Fill remaining slots in column with null if not full
        while (currentColumn.length < 7) {
          currentColumn.push(null);
        }
        weekColumns.push({
          days: [...currentColumn],
          month: monthData.month,
          monthName: monthData.name,
          weekIndex: globalWeekIndex,
          isFirstWeekOfMonth:
            weekColumns.length === 0 ||
            weekColumns[weekColumns.length - 1]?.month !== monthData.month,
        });
        currentColumn = [];
        currentDayPosition = 0; // Reset to top for next column
        globalWeekIndex++;
      }
    }
  });

  return {
    weekColumns,
    months: months.map((m) => ({ name: m.name, month: m.month })),
    totalSubmissions,
    totalActiveDays,
    maxStreak,
  };
};

const Heatmap: React.FC<HeatmapProps> = ({ data }) => {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const { weekColumns, totalSubmissions, totalActiveDays, maxStreak } =
    React.useMemo(() => generateHeatmapData(data), [data]);

  // Group week columns by month-year
  const monthBlocks = React.useMemo(() => {
    const blocks: MonthBlock[] = [];
    let currentMonth: number | null = null;
    let currentYear: number | null = null;
    let currentBlock: MonthBlock | null = null;
    weekColumns.forEach((col) => {
      // Find the first non-null day to determine the month and year
      const firstDay = col.days.find((d) => d);
      if (!firstDay) return;
      const month = firstDay.month;
      const year = firstDay.year;
      if (!currentBlock || currentMonth !== month || currentYear !== year) {
        if (currentBlock) blocks.push(currentBlock);
        currentBlock = {
          month,
          year,
          name: getMonthName(month),
          weekColumns: [],
        };
        currentMonth = month;
        currentYear = year;
      }
      currentBlock.weekColumns.push(col);
    });
    if (currentBlock) blocks.push(currentBlock);
    return blocks;
  }, [weekColumns]);

  React.useEffect(() => {
    if (scrollContainerRef.current) {
      // Scroll to the far right (most recent month)
      scrollContainerRef.current.scrollLeft =
        scrollContainerRef.current.scrollWidth;
    }
  }, [monthBlocks.length]);

  return (
    <Card className="w-full h-full py-4 px-6 bg-card rounded-xl gap-0 border-none shadow-none theme-transition overflow-hidden">
      {/* <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between p-0">
        <div className="flex items-center gap-2 text-sm text-muted-foreground theme-transition">
          <span className="font-semibold text-sm truncate">
            {totalSubmissions}
          </span>{" "}
          submissions in the past one year
        </div>
        <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground theme-transition truncate">
          <span>
            Total active days:{" "}
            <span className="font-semibold text-gh-text-light ">
              {totalActiveDays}
            </span>
          </span>
          <span className="truncate">
            Max streak:{" "}
            <span className="font-semibold text-gh-text-light">
              {maxStreak}
            </span>
          </span>
        </div>
      </CardHeader> */}
      <div className="w-full h-full">
        <TooltipProvider delayDuration={300}>
          <div
            ref={scrollContainerRef}
            className="relative overflow-x-auto hide-scrollbar w-full h-full theme-transition"
          >
            {/* Month blocks with centered labels */}
            <div className="flex min-w-max h-full items-end">
              {monthBlocks.map((block, blockIdx) => (
                <div
                  key={`${block.name}-${block.year}`}
                  className={`flex flex-col items-center theme-transition ${blockIdx > 0 ? "ml-0" : ""}`}
                  style={{ minWidth: `${block.weekColumns.length * 16}px` }}
                >
                  <div className="flex theme-transition">
                    {block.weekColumns.map((column, weekIdx) => (
                      <div
                        key={weekIdx}
                        className={`flex flex-col gap-0.5 theme-transition ${
                          weekIdx > 0 ? "ml-0.5" : ""
                        }`}
                      >
                        {column.days.map((day, dayIdx) => {
                          if (!day) {
                            return (
                              <div
                                key={`empty-${dayIdx}`}
                                className="w-3 h-3"
                              />
                            );
                          }
                          return (
                            <Tooltip
                              key={`${day.date.getTime()}-${dayIdx}`}
                              delayDuration={200}
                            >
                              <TooltipTrigger asChild>
                                <div
                                  tabIndex={0}
                                  aria-label={`${day.count} submissions on ${getMonthName(day.date.getMonth())} ${day.date.getDate()}, ${day.date.getFullYear()}`}
                                  className={`w-3 h-3 rounded-xs ${getDayColor(day.count)} cursor-pointer theme-transition`}
                                />
                              </TooltipTrigger>
                              <TooltipContent className="bg-card text-muted-foreground text-sm p-2 rounded-md theme-transition">
                                <span>
                                  {day.count} submissions on{" "}
                                  {getMonthName(day.date.getMonth())}{" "}
                                  {day.date.getDate()}, {day.date.getFullYear()}
                                </span>
                              </TooltipContent>
                            </Tooltip>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground mt-4 theme-transition">
                    {block.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </TooltipProvider>
      </div>
    </Card>
  );
};

export default React.memo(Heatmap);
