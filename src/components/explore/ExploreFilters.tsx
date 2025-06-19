import React, { useState, useEffect } from "react";
import { Input } from "../ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "../ui/select";
import { DatePicker, NumberInput, Slider } from "@heroui/react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../ui/dropdown-menu";
import { CalendarDate, DateValue } from "@internationalized/date";
import { RangeCalendar } from "@heroui/react";
import { today, getLocalTimeZone } from "@internationalized/date";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const GENDER_OPTIONS = ["Any", "Male", "Female", "Other"];
const INTEREST_OPTIONS = [
  "Adventure",
  "Culture",
  "Food",
  "Nature",
  "Nightlife",
  "Relaxation",
  "Shopping",
  "Sports",
];
const DESTINATION_OPTIONS = [
  "Any",
  "Paris",
  "London",
  "New York",
  "Tokyo",
  "Sydney",
  "Rome",
  "Barcelona",
  "Bangkok",
  "Dubai",
  "Singapore",
];

interface ExploreFiltersProps {
  filters: FiltersState;
  onFilterChange: (filters: FiltersState) => void;
}

interface FiltersState {
  destination: string;
  dateStart: Date | undefined;
  dateEnd: Date | undefined;
  ageMin: number;
  ageMax: number;
  gender: string;
  interests: string[];
}

const DEFAULT_FILTERS: FiltersState = {
  destination: "",
  dateStart: undefined,
  dateEnd: undefined,
  ageMin: 18,
  ageMax: 99,
  gender: "Any",
  interests: [],
};

const DEBOUNCE_MS = 300;

// Helper to convert CalendarDate to JS Date (UTC)
function calendarDateToDate(
  cd: CalendarDate | null | undefined
): Date | undefined {
  if (!cd) return undefined;
  return new Date(Date.UTC(cd.year, cd.month - 1, cd.day));
}

// Helper to convert JS Date to CalendarDate
function dateToCalendarDate(date?: Date): CalendarDate | undefined {
  if (!date) return undefined;
  return new CalendarDate(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate()
  );
}

const ExploreFilters: React.FC<ExploreFiltersProps> = ({
  filters,
  onFilterChange,
}) => {
  const safeFilters = filters ?? DEFAULT_FILTERS;
  // Track which dropdown is open
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Handlers
  const handleDestinationSelect = (destination: string) => {
    onFilterChange({ ...safeFilters, destination });
  };

  // Date Range Handler
  const handleDateRangeChange = ({
    start,
    end,
  }: {
    start: CalendarDate | null;
    end: CalendarDate | null;
  }) => {
    onFilterChange({
      ...safeFilters,
      dateStart: calendarDateToDate(start),
      dateEnd: calendarDateToDate(end),
    });
  };

  // Age Range Handler
  const handleAgeRangeChange = ([min, max]: [number, number]) => {
    onFilterChange({ ...safeFilters, ageMin: min, ageMax: max });
  };

  const handleGenderChange = (value: string) => {
    onFilterChange({ ...safeFilters, gender: value });
  };

  const handleInterestToggle = (interest: string) => {
    onFilterChange(
      safeFilters.interests.includes(interest)
        ? {
            ...safeFilters,
            interests: safeFilters.interests.filter((i) => i !== interest),
          }
        : { ...safeFilters, interests: [...safeFilters.interests, interest] }
    );
  };

  // Filter summary helpers
  // const getDateRangeLabel = () => {
  //   const format = (cd: CalendarDate | null) => {
  //     if (!cd) return "";
  //     const d = calendarDateToDate(cd);
  //     return d ? d.toLocaleDateString() : "";
  //   };
  //   if (!safeFilters.dateStart && !safeFilters.dateEnd) return "Date Range";
  //   if (safeFilters.dateStart && safeFilters.dateEnd) {
  //     return `${format(safeFilters.dateStart)} - ${format(
  //       safeFilters.dateEnd
  //     )}`;
  //   }
  //   if (safeFilters.dateStart) return `From ${format(safeFilters.dateStart)}`;
  //   if (safeFilters.dateEnd) return `Until ${format(safeFilters.dateEnd)}`;
  //   return "Date Range";
  // };

  const getAgeRangeLabel = () => {
    if (safeFilters.ageMin === 18 && safeFilters.ageMax === 99)
      return "Age Range";
    return `${safeFilters.ageMin} - ${safeFilters.ageMax}`;
  };

  const getGenderLabel = () =>
    !safeFilters.gender || safeFilters.gender === "Any"
      ? "Gender"
      : safeFilters.gender;

  const getInterestsLabel = () =>
    safeFilters.interests.length === 0
      ? "Interests"
      : safeFilters.interests.join(", ");

  const getDestinationLabel = () =>
    !safeFilters.destination || safeFilters.destination === "Any"
      ? "Destination"
      : safeFilters.destination;

  // Build RangeCalendar value object conditionally
  const startCal = dateToCalendarDate(safeFilters.dateStart);
  const endCal = dateToCalendarDate(safeFilters.dateEnd);
  let calendarValue: { start?: CalendarDate; end?: CalendarDate } | null = null;
  if (startCal && endCal) {
    calendarValue = { start: startCal, end: endCal };
  } else if (startCal) {
    calendarValue = { start: startCal };
  } else if (endCal) {
    calendarValue = { end: endCal };
  } else {
    calendarValue = null;
  }

  return (
    <section className="flex flex-wrap gap-2 items-center min-w-0">
      {/* Destination Dropdown */}
      <DropdownMenu
        open={openDropdown === "destination"}
        onOpenChange={(open) => setOpenDropdown(open ? "destination" : null)}
      >
        <DropdownMenuTrigger asChild className="">
          <Button
            variant={"outline"}
            className="bg-card rounded-full min-w-[140px] px-4 py-2 text-primary font-medium flex items-center justify-between focus:outline-none focus:ring-0 focus:ring-transparent"
            aria-label="Destination filter"
          >
            {getDestinationLabel()}
            <ChevronDown className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="p-3 min-w-[220px] backdrop-blur-2xl bg-white/50 rounded-2xl shadow-md transition-all duration-300 ease-in-out border-none
        "
        >
          {DESTINATION_OPTIONS.map((destination) => (
            <DropdownMenuItem
              key={destination}
              className={
                "w-full rounded-md px-4 py-1 text-sm border-none cursor-pointer flex items-center hover:!bg-transparent hover:!border-none hover:!outline-none focus-within:!bg-transparent focus-within:!border-none focus-within:!outline-none bg-transparent text-foreground focus-within:!text-foreground"
              }
              aria-pressed={safeFilters.destination === destination}
              tabIndex={0}
              aria-label={destination}
              onClick={() => handleDestinationSelect(destination)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ")
                  handleDestinationSelect(destination);
              }}
            >
              {destination}
              {safeFilters.destination === destination && (
                <Check
                  className="w-4 h-4 ml-auto text-primary"
                  aria-hidden="true"
                />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Date Range Dropdown */}
      <DropdownMenu
        open={openDropdown === "date"}
        onOpenChange={(open) => setOpenDropdown(open ? "date" : null)}
      >
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="rounded-full border-primary/30 bg-card min-w-[140px] px-4 py-2 text-primary font-medium flex items-center justify-between focus:outline-none focus:ring-0 focus:ring-transparent"
            aria-label="Date range filter"
          >
            {/* {getDateRangeLabel()} */}
            Date Range
            <ChevronDown className="ml-2 w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="min-w-[250px] backdrop-blur-2xl bg-white/50 rounded-2xl shadow-md transition-all duration-300 ease-in-out border-none">
          <div>
            <RangeCalendar
              value={calendarValue as any}
              onChange={(range: { start?: DateValue; end?: DateValue }) => {
                const start =
                  range.start instanceof CalendarDate ? range.start : undefined;
                const end =
                  range.end instanceof CalendarDate ? range.end : undefined;
                onFilterChange({
                  ...safeFilters,
                  dateStart: start ? calendarDateToDate(start) : undefined,
                  dateEnd: end ? calendarDateToDate(end) : undefined,
                });
              }}
              minValue={today(getLocalTimeZone())}
              classNames={{
                base: cn("bg-transparent"),
                headerWrapper: cn("bg-transparent"),
                gridHeader: cn("bg-transparent"),
              }}
            />
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Age Range Dropdown */}
      <DropdownMenu
        open={openDropdown === "age"}
        onOpenChange={(open) => setOpenDropdown(open ? "age" : null)}
      >
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="rounded-full border-primary/30 bg-card min-w-[140px] px-4 py-2 text-primary font-medium flex items-center justify-between focus:outline-none focus:ring-0 focus:ring-transparent"
            aria-label="Age range filter"
          >
            Age Range
            <ChevronDown className="ml-2 w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="p-4 min-w-[250px] backdrop-blur-2xl bg-white/50 rounded-2xl shadow-md transition-all duration-300 ease-in-out border-none">
          <Slider
            className="max-w-lg"
            value={[safeFilters.ageMin, safeFilters.ageMax]}
            onChange={(value: number | number[]) => {
              if (Array.isArray(value) && value.length === 2) {
                onFilterChange({
                  ...safeFilters,
                  ageMin: value[0],
                  ageMax: value[1],
                });
              }
            }}
            formatOptions={{ style: "decimal" }}
            label="Age Range"
            maxValue={100}
            minValue={18}
            step={1}
            size="sm"
          />
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Gender Dropdown */}
      <DropdownMenu
        open={openDropdown === "gender"}
        onOpenChange={(open) => setOpenDropdown(open ? "gender" : null)}
      >
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="rounded-full border-primary/30 bg-card min-w-[140px] px-4 py-2 text-primary font-medium flex items-center justify-between focus:outline-none focus:ring-0 focus:ring-transparent"
            aria-label="Gender filter"
          >
            {getGenderLabel()}
            <ChevronDown className="ml-2 w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="p-4 min-w-[160px] backdrop-blur-2xl bg-white/50 rounded-2xl shadow-md transition-all duration-300 ease-in-out border-none">
          {GENDER_OPTIONS.map((option) => (
            <DropdownMenuItem
              key={option}
              className={
                "w-full rounded-md px-4 py-1 text-sm border-none cursor-pointer flex items-center hover:!bg-transparent hover:!border-none hover:!outline-none focus-within:!bg-transparent focus-within:!border-none focus-within:!outline-none bg-transparent text-foreground focus-within:!text-foreground"
              }
              aria-pressed={safeFilters.gender === option}
              tabIndex={0}
              aria-label={option}
              onClick={() => handleGenderChange(option)}
            >
              {option}
              {safeFilters.gender === option && (
                <Check
                  className="w-4 h-4 ml-auto text-primary"
                  aria-hidden="true"
                />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Interests Dropdown */}
      <DropdownMenu
        open={openDropdown === "interests"}
        onOpenChange={(open) => setOpenDropdown(open ? "interests" : null)}
      >
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="rounded-full border-primary/30 bg-card min-w-[140px] px-4 py-2 text-primary font-medium flex items-center justify-between focus:outline-none focus:ring-0 focus:ring-transparent"
            aria-label="Interests filter"
          >
            Interests
            <ChevronDown className="ml-2 w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="p-4 min-w-[220px] backdrop-blur-2xl bg-white/50 rounded-2xl shadow-md transition-all duration-300 ease-in-out border-none ">
          {INTEREST_OPTIONS.map((interest) => (
            <DropdownMenuItem
              key={interest}
              className={
                "w-full rounded-md px-4 py-1 text-sm border-none cursor-pointer flex items-center hover:!bg-transparent hover:!border-none hover:!outline-none focus-within:!bg-transparent focus-within:!border-none focus-within:!outline-none bg-transparent text-foreground focus-within:!text-foreground"
              }
              aria-pressed={safeFilters.interests.includes(interest)}
              tabIndex={0}
              aria-label={interest}
              onClick={(e) => {
                e.preventDefault();
                handleInterestToggle(interest);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleInterestToggle(interest);
                }
              }}
            >
              {interest}
              {safeFilters.interests.includes(interest) && (
                <Check
                  className="w-4 h-4 ml-auto text-primary"
                  aria-hidden="true"
                />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </section>
  );
};

export default ExploreFilters;
