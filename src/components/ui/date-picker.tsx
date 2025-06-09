"use client";

import {
  eachMonthOfInterval,
  eachYearOfInterval,
  endOfYear,
  format,
  getMonth,
  setMonth,
  setYear,
  startOfYear,
} from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  startYear?: number;
  endYear?: number;
  date?: Date;
  onDateChange?: (date: Date | undefined) => void;
}

export function DatePicker({
  startYear = new Date().getFullYear() - 5,
  endYear = new Date().getFullYear(),
  date: controlledDate,
  onDateChange,
}: DatePickerProps) {
  const [date, setDate] = React.useState<Date | undefined>(controlledDate);

  React.useEffect(() => {
    setDate(controlledDate);
  }, [controlledDate]);

  const handleDateChange = (newDate: Date | undefined) => {
    setDate(newDate);
    onDateChange?.(newDate);
  };

  // List Months
  const months = eachMonthOfInterval({
    start: startOfYear(startYear),
    end: endOfYear(endYear),
  }).map((month) => month.toLocaleString("en-US", { month: "long" }));

  // List Years
  const years = eachYearOfInterval({
    start: startOfYear(new Date(startYear, 0, 1)),
    end: endOfYear(new Date(endYear, 0, 1)),
  }).map((year) => year.getFullYear());

  const handleMonthChange = (month: string) => {
    const newMonth = setMonth(date || new Date(), months.indexOf(month));
    setDate(newMonth);
  };

  const handleYearChange = (year: string) => {
    const newYear = setYear(date || new Date(), parseInt(year));
    setDate(newYear);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full pl-3 text-left text-muted-foreground hover:text-muted-foreground font-normal h-9 border-border rounded-lg  focus:ring-1 focus:ring-transparent bg-white",
            !date && "text-foreground",
            "hover:bg-transparent"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <div className="flex items-center justify-between p-4 pb-0 gap-2">
          <Select
            onValueChange={handleMonthChange}
            value={months[getMonth(date || new Date())]}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Months" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {months.map((month) => (
                  <SelectItem key={month} value={month}>
                    {month}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Select
            onValueChange={handleYearChange}
            value={String(date?.getFullYear() || new Date().getFullYear())}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Years" />
            </SelectTrigger>
            <SelectContent className="max-h-[280px] overflow-y-auto">
              <SelectGroup>
                {years.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDateChange}
          initialFocus
          month={date || new Date()}
          onMonthChange={handleDateChange}
          fromYear={startYear}
          toYear={endYear}
        />
      </PopoverContent>
    </Popover>
  );
}
