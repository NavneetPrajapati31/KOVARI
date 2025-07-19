"use client"

import type React from "react"
import { useMemo, useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"

interface TravelActivityHeatmapProps {
  travelDays: string[]
  year?: number
  years?: number[]
  setSelectedYear?: (y: number) => void
}

interface DayData {
  date: Date
  count: number
  dateString: string
  weekIndex: number
  dayOfWeek: number
}

const TravelActivityHeatmap: React.FC<TravelActivityHeatmapProps> = ({
  travelDays,
  year = new Date().getFullYear(),
  years,
  setSelectedYear,
}) => {
  const [hoveredDay, setHoveredDay] = useState<DayData | null>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const [cellAndGapWidth, setCellAndGapWidth] = useState(12) // Default for mobile: 10px cell + 2px gap

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        // Tailwind's 'md' breakpoint
        setCellAndGapWidth(14) // Desktop: 12px cell + 2px gap
      } else {
        setCellAndGapWidth(12) // Mobile: 10px cell + 2px gap
      }
    }

    handleResize() // Set initial value
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const { maxCount, weeks } = useMemo(() => {
    const dateCountMap = new Map<string, number>()
    travelDays.forEach((dateStr) => {
      const count = dateCountMap.get(dateStr) || 0
      dateCountMap.set(dateStr, count + 1)
    })

    const startDate = new Date(year, 0, 1)
    const firstSunday = new Date(startDate)
    firstSunday.setDate(startDate.getDate() - startDate.getDay())

    let maxCount = 0
    const weeksArray: (DayData | null)[][] = []
    const currentDate = new Date(firstSunday)
    let weekIndex = 0

    // Loop until we've covered all weeks of the year
    // We go slightly beyond the year to ensure all weeks starting in the year are included
    while (
      currentDate.getFullYear() <= year ||
      (currentDate.getFullYear() === year + 1 && currentDate.getMonth() === 0)
    ) {
      const week: (DayData | null)[] = []
      for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
        const dateString = currentDate.toISOString().split("T")[0]
        const count = dateCountMap.get(dateString) || 0
        maxCount = Math.max(maxCount, count)

        // Only include days that fall within the target year
        if (currentDate.getFullYear() === year) {
          const dayData: DayData = {
            date: new Date(currentDate),
            count,
            dateString,
            weekIndex,
            dayOfWeek,
          }
          week.push(dayData)
        } else {
          week.push(null) // Placeholder for days outside the target year
        }
        currentDate.setDate(currentDate.getDate() + 1)
      }
      weeksArray.push(week)
      weekIndex++
      // Break if we've gone well past the year (e.g., into February of next year)
      if (currentDate.getFullYear() > year && currentDate.getMonth() > 1) break
    }
    return { maxCount, weeks: weeksArray }
  }, [travelDays, year])

  const monthSpans = useMemo(() => {
    const spans: { month: string; weeks: number; width: number }[] = []
    let lastMonth = -1
    let weekCount = 0

    weeks.forEach((week) => {
      const firstDay = week.find((d) => d) // Find the first valid day in the week
      if (firstDay) {
        const month = firstDay.date.getMonth()
        if (month !== lastMonth) {
          if (weekCount > 0) {
            spans[spans.length - 1].weeks = weekCount
            spans[spans.length - 1].width = weekCount * cellAndGapWidth
          }
          spans.push({
            month: firstDay.date.toLocaleDateString("en-US", { month: "short" }),
            weeks: 1,
            width: cellAndGapWidth, // Initial width for the first week of the new month
          })
          lastMonth = month
          weekCount = 1
        } else {
          weekCount++
          spans[spans.length - 1].weeks = weekCount // Update weeks count
          spans[spans.length - 1].width = weekCount * cellAndGapWidth // Update width
        }
      }
    })

    // Ensure the last month's span is correctly set
    if (spans.length && weekCount > 0) {
      spans[spans.length - 1].weeks = weekCount
      spans[spans.length - 1].width = weekCount * cellAndGapWidth
    }
    return spans
  }, [weeks, year, cellAndGapWidth])

  const formatDate = (date: Date) =>
    date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    })

  const getIntensityClass = (count: number) => {
    if (count === 0 || maxCount === 0) return "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
    const intensity = count / maxCount
    if (intensity <= 0.25) return "bg-green-100 dark:bg-green-900 border-green-200 dark:border-green-800"
    if (intensity <= 0.5) return "bg-green-200 dark:bg-green-800 border-green-300 dark:border-green-700"
    if (intensity <= 0.75) return "bg-green-300 dark:bg-green-700 border-green-400 dark:border-green-600"
    return "bg-green-400 dark:bg-green-600 border-green-500 dark:border-green-500"
  }

  const handleMouseEnter = (day: DayData, event: React.MouseEvent) => {
    setHoveredDay(day)
    updateMousePosition(event)
  }

  const handleMouseMove = (event: React.MouseEvent) => {
    updateMousePosition(event)
  }

  const handleMouseLeave = () => {
    setHoveredDay(null)
  }

  const updateMousePosition = (event: React.MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setMousePosition({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      })
    }
  }

  return (
    <Card className="w-full bg-white rounded-2xl border-0 flex flex-col items-center justify-center shadow-none">
      <CardHeader className="pb-2 md:pb-4 flex flex-col items-center w-full">
        {years && setSelectedYear && (
          <div className="w-full flex flex-col sm:flex-row justify-between items-center mb-2 gap-2">
            <span className="text-base md:text-lg font-medium text-gray-600">Travel Activity Heatmap</span>
            <select
              className="border rounded px-2 py-1 text-xs md:text-sm"
              value={year}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        )}
        <CardTitle className="text-lg md:text-2xl font-bold text-center">Travel Activity</CardTitle>
      </CardHeader>
      {/* CardContent is now the relative container for the tooltip */}
      <CardContent className="p-2 md:p-4 flex flex-col items-center justify-center w-full relative" ref={containerRef}>
        <style>{`
          .heatmap-scrollbar {
            scrollbar-width: thin;
            scrollbar-color: #d1d5db #fff;
          }
          .heatmap-scrollbar::-webkit-scrollbar {
            height: 4px;
            background: #fff;
          }
          .heatmap-scrollbar::-webkit-scrollbar-thumb {
            background: #d1d5db;
            border-radius: 4px;
          }
        `}</style>
        {/* Outer div to center the scrollable content */}
        <div className="w-full flex justify-center">
          <div className="overflow-x-auto scrollbar-hide">
            {/* This inner div contains the actual heatmap content (months + grid) */}
            <div className="flex flex-col" style={{ minWidth: `${weeks.length * cellAndGapWidth}px` }}>
              {/* Month Labels */}
              <div
                className="flex mb-2 md:mb-3 flex-nowrap"
                style={{ minWidth: `${weeks.length * cellAndGapWidth}px` }}
              >
                {monthSpans.map(({ month, width }, i) => (
                  <div
                    key={`${month}-${i}`}
                    className="text-[10px] md:text-xs font-medium text-gray-700 text-center"
                    style={{
                      lineHeight: "1rem",
                      minWidth: `${width}px`,
                      maxWidth: `${width}px`,
                      wordBreak: "keep-all",
                    }}
                  >
                    {month}
                  </div>
                ))}
              </div>
              {/* Grid */}
              <div className="flex gap-[2px] flex-nowrap" style={{ minWidth: `${weeks.length * cellAndGapWidth}px` }}>
                {weeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col gap-[2px]">
                    {week.map((day, dayIndex) => (
                      <div
                        key={`${weekIndex}-${dayIndex}`}
                        className={`w-[10px] h-[10px] md:w-[12px] md:h-[12px] rounded-sm border transition-all duration-200 cursor-pointer hover:ring-2 hover:ring-blue-400 hover:ring-opacity-50 ${
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
        </div>
        {/* Tooltip (positioned relative to CardContent) */}
        {hoveredDay && (
          <div
            className="absolute z-50 bg-gray-900 text-white text-xs md:text-sm rounded-lg px-2 md:px-3 py-1 md:py-2 pointer-events-none border border-gray-700"
            style={{
              left: Math.min(
                mousePosition.x + 8,
                containerRef.current ? containerRef.current.offsetWidth - 180 : window.innerWidth - 180,
              ),
              top: mousePosition.y + 8,
              minWidth: "120px",
              maxWidth: "220px",
              whiteSpace: "nowrap",
            }}
          >
            <div className="font-semibold">{formatDate(hoveredDay.date)}</div>
            <div className="text-xs opacity-90">{hoveredDay.count > 0 ? "Traveled" : "No travel"}</div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default TravelActivityHeatmap
