"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Plane, MapPin } from "lucide-react";
import {
  format,
  addDays,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  isBefore,
  isAfter,
  differenceInDays,
} from "date-fns";

import { cn } from "@/shared/utils/utils";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface TravelDatePickerProps {
  onDateSelect?: (range: DateRange) => void;
  minStay?: number;
  maxAdvanceBooking?: number;
  className?: string;
}

export default function TravelDatePicker({
  onDateSelect,
  minStay = 1,
  maxAdvanceBooking = 365,
  className,
}: TravelDatePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedRange, setSelectedRange] = useState<DateRange>({
    from: undefined,
    to: undefined,
  });
  const [isSelectingEndDate, setIsSelectingEndDate] = useState(false);

  const today = new Date();
  const maxDate = addDays(today, maxAdvanceBooking);

  // Quick preset options
  const presets = [
    { label: "Weekend (2 nights)", days: 2 },
    { label: "Short trip (3 nights)", days: 3 },
    { label: "Week (7 nights)", days: 7 },
    { label: "Two weeks (14 nights)", days: 14 },
  ];

  const handleDateClick = (date: Date) => {
    if (isBefore(date, today) || isAfter(date, maxDate)) return;

    if (
      !selectedRange.from ||
      (selectedRange.from && selectedRange.to) ||
      isBefore(date, selectedRange.from)
    ) {
      // Start new selection
      const newRange = { from: date, to: undefined };
      setSelectedRange(newRange);
      setIsSelectingEndDate(true);
      onDateSelect?.(newRange);
    } else if (selectedRange.from && !selectedRange.to) {
      // Complete the range
      const daysDiff = differenceInDays(date, selectedRange.from);
      if (daysDiff >= minStay - 1) {
        const newRange = { from: selectedRange.from, to: date };
        setSelectedRange(newRange);
        setIsSelectingEndDate(false);
        onDateSelect?.(newRange);
      }
    }
  };

  const handlePresetClick = (days: number) => {
    const from = new Date();
    const to = addDays(from, days);
    const newRange = { from, to };
    setSelectedRange(newRange);
    setIsSelectingEndDate(false);
    onDateSelect?.(newRange);
  };

  const isDateInRange = (date: Date) => {
    if (!selectedRange.from) return false;
    if (!selectedRange.to) return isSameDay(date, selectedRange.from);
    return (
      (isAfter(date, selectedRange.from) ||
        isSameDay(date, selectedRange.from)) &&
      (isBefore(date, selectedRange.to) || isSameDay(date, selectedRange.to))
    );
  };

  const isDateDisabled = (date: Date) => {
    if (isBefore(date, today) || isAfter(date, maxDate)) return true;

    if (selectedRange.from && !selectedRange.to && isSelectingEndDate) {
      const daysDiff = differenceInDays(date, selectedRange.from);
      return daysDiff < minStay - 1;
    }

    return false;
  };

  const getDayClasses = (date: Date) => {
    const baseClasses =
      "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

    if (isDateDisabled(date)) {
      return cn(
        baseClasses,
        "text-muted-foreground opacity-50 cursor-not-allowed hover:bg-transparent"
      );
    }

    if (selectedRange.from && isSameDay(date, selectedRange.from)) {
      return cn(
        baseClasses,
        "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground rounded-l-md rounded-r-none"
      );
    }

    if (selectedRange.to && isSameDay(date, selectedRange.to)) {
      return cn(
        baseClasses,
        "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground rounded-r-md rounded-l-none"
      );
    }

    if (isDateInRange(date) && selectedRange.from && selectedRange.to) {
      return cn(baseClasses, "bg-accent text-accent-foreground rounded-none");
    }

    if (isToday(date)) {
      return cn(baseClasses, "bg-accent text-accent-foreground font-semibold");
    }

    if (!isSameMonth(date, currentMonth)) {
      return cn(baseClasses, "text-muted-foreground opacity-50");
    }

    // Weekend highlighting
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return cn(baseClasses, "text-blue-600 font-medium");
    }

    return baseClasses;
  };

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = new Date(monthStart);
    calendarStart.setDate(calendarStart.getDate() - monthStart.getDay());
    const calendarEnd = new Date(monthEnd);
    calendarEnd.setDate(calendarEnd.getDate() + (6 - monthEnd.getDay()));

    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    return (
      <div className="grid grid-cols-7 gap-1">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
          <div
            key={day}
            className="h-9 w-9 flex items-center justify-center text-sm font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
        {days.map((date) => (
          <Button
            key={date.toISOString()}
            variant="ghost"
            className={getDayClasses(date)}
            onClick={() => handleDateClick(date)}
            disabled={isDateDisabled(date)}
            aria-label={format(date, "MMMM d, yyyy")}
          >
            {format(date, "d")}
          </Button>
        ))}
      </div>
    );
  };

  const formatDateRange = () => {
    if (!selectedRange.from) return "Select dates";
    if (!selectedRange.to)
      return `${format(selectedRange.from, "MMM d")} - Select end date`;

    const nights = differenceInDays(selectedRange.to, selectedRange.from);
    return `${format(selectedRange.from, "MMM d")} - ${format(
      selectedRange.to,
      "MMM d"
    )} (${nights} night${nights !== 1 ? "s" : ""})`;
  };

  return (
    <Card className={cn("w-full max-w-md mx-auto", className)}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Plane className="h-5 w-5 text-primary" />
          Select Travel Dates
        </CardTitle>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>{formatDateRange()}</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Quick Presets */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Quick Select</h4>
          <div className="flex flex-wrap gap-2">
            {presets.map((preset) => (
              <Button
                key={preset.label}
                variant="outline"
                size="sm"
                onClick={() => handlePresetClick(preset.days)}
                className="text-xs"
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Calendar Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setCurrentMonth(
                new Date(
                  currentMonth.getFullYear(),
                  currentMonth.getMonth() - 1
                )
              )
            }
            disabled={isSameMonth(currentMonth, today)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <h3 className="font-semibold">{format(currentMonth, "MMMM yyyy")}</h3>

          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setCurrentMonth(
                new Date(
                  currentMonth.getFullYear(),
                  currentMonth.getMonth() + 1
                )
              )
            }
            disabled={isAfter(addDays(startOfMonth(currentMonth), 32), maxDate)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Calendar Grid */}
        {renderCalendar()}

        {/* Legend */}
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground pt-2 border-t">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-primary rounded-sm"></div>
            <span>Selected</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-accent rounded-sm"></div>
            <span>Today</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded-sm"></div>
            <span>Weekend</span>
          </div>
        </div>

        {/* Selection Info */}
        {selectedRange.from && selectedRange.to && (
          <div className="bg-muted/50 p-3 rounded-lg">
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium">Trip Duration:</span>
              <Badge variant="secondary">
                {differenceInDays(selectedRange.to, selectedRange.from)} nights
              </Badge>
            </div>
          </div>
        )}

        {/* Minimum Stay Notice */}
        {minStay > 1 && (
          <p className="text-xs text-muted-foreground">
            Minimum stay: {minStay} night{minStay !== 1 ? "s" : ""}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
