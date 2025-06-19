import React, { useState, useEffect, useRef } from "react";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "../ui/select";
import { DatePicker, NumberInput, Slider, Input } from "@heroui/react";
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
  mode: "group" | "traveler";
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
  mode,
}) => {
  const safeFilters = filters ?? DEFAULT_FILTERS;
  // Track which dropdown is open
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  // Local state for age range slider
  const [ageRange, setAgeRange] = useState<[number, number]>([
    safeFilters.ageMin,
    safeFilters.ageMax,
  ]);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const [destinationInput, setDestinationInput] = useState(
    safeFilters.destination || ""
  );
  const [filteredDestinations, setFilteredDestinations] =
    useState<string[]>(DESTINATION_OPTIONS);
  const destinationDebounceTimeout = useRef<NodeJS.Timeout | null>(null);

  // Sync local ageRange with filters from parent
  useEffect(() => {
    setAgeRange([safeFilters.ageMin, safeFilters.ageMax]);
  }, [safeFilters.ageMin, safeFilters.ageMax]);

  // Debounced filter update for age range
  useEffect(() => {
    if (
      ageRange[0] !== safeFilters.ageMin ||
      ageRange[1] !== safeFilters.ageMax
    ) {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
      debounceTimeout.current = setTimeout(() => {
        onFilterChange({
          ...safeFilters,
          ageMin: ageRange[0],
          ageMax: ageRange[1],
        });
      }, DEBOUNCE_MS);
    }
    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ageRange]);

  // Sync local input with parent filter
  useEffect(() => {
    setDestinationInput(safeFilters.destination || "");
  }, [safeFilters.destination]);

  // Filter options as user types
  useEffect(() => {
    const input = destinationInput.trim().toLowerCase();
    if (!input) {
      setFilteredDestinations(DESTINATION_OPTIONS);
    } else {
      setFilteredDestinations(
        DESTINATION_OPTIONS.filter((opt) => opt.toLowerCase().includes(input))
      );
    }
  }, [destinationInput]);

  // Debounce custom value
  useEffect(() => {
    if (
      destinationInput !== safeFilters.destination &&
      !DESTINATION_OPTIONS.some(
        (opt) => opt.toLowerCase() === destinationInput.trim().toLowerCase()
      )
    ) {
      if (destinationDebounceTimeout.current)
        clearTimeout(destinationDebounceTimeout.current);
      destinationDebounceTimeout.current = setTimeout(() => {
        onFilterChange({ ...safeFilters, destination: destinationInput });
      }, DEBOUNCE_MS);
    }
    return () => {
      if (destinationDebounceTimeout.current)
        clearTimeout(destinationDebounceTimeout.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destinationInput]);

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

  // Age Range Handler (no longer calls onFilterChange directly)
  const handleAgeRangeChange = ([min, max]: [number, number]) => {
    setAgeRange([min, max]);
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
            className="bg-card rounded-full px-4 py-2 text-primary font-medium flex items-center justify-between focus:outline-none focus:ring-0 focus:ring-transparent"
            aria-label="Destination filter"
          >
            {safeFilters.destination && safeFilters.destination !== "Any"
              ? safeFilters.destination
              : "Destination"}
            <ChevronDown className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="p-3 min-w-[220px] backdrop-blur-2xl bg-white/50 rounded-2xl shadow-md transition-all duration-300 ease-in-out border-none">
          <style>
            {`
              [data-slot="input-wrapper"] {
                border: none !important;
              }
              [data-slot="input-wrapper"]::after {
                display: none !important;
              }
            `}
          </style>
          <div
            style={
              {
                outline: "none",
                boxShadow: "none",
                "--tw-ring-shadow": "none",
                "--tw-ring-color": "transparent",
                "--tw-ring-offset-shadow": "none",
              } as React.CSSProperties
            }
          >
            <Input
              variant="underlined"
              id="destination-input"
              type="text"
              placeholder="Type city or country..."
              value={destinationInput}
              onChange={(e) => setDestinationInput(e.target.value)}
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  !filteredDestinations.some(
                    (opt) =>
                      opt.toLowerCase() ===
                      destinationInput.trim().toLowerCase()
                  )
                ) {
                  onFilterChange({
                    ...safeFilters,
                    destination: destinationInput,
                  });
                  setOpenDropdown(null);
                }
              }}
              style={
                {
                  outline: "none",
                  boxShadow: "none",
                  "--tw-ring-shadow": "none",
                  "--tw-ring-color": "transparent",
                  "--tw-ring-offset-shadow": "none",
                  background: "transparent",
                  backgroundColor: "transparent",
                  height: "32px",
                  paddingTop: "4px",
                  paddingBottom: "4px",
                } as React.CSSProperties
              }
              className="mb-2"
              aria-label="Destination filter"
              autoFocus
            />
          </div>
          <div className="max-h-[500px] overflow-y-auto">
            {filteredDestinations.filter((dest) => dest !== "Any").length >
            0 ? (
              filteredDestinations
                .filter((destination) => destination !== "Any")
                .map((destination) => (
                  <DropdownMenuItem
                    key={destination}
                    className={
                      "w-full rounded-md px-4 py-1 text-sm border-none cursor-pointer flex items-center hover:!bg-transparent hover:!border-none hover:!outline-none focus-within:!bg-transparent focus-within:!border-none focus-within:!outline-none bg-transparent text-foreground focus-within:!text-foreground"
                    }
                    aria-pressed={safeFilters.destination === destination}
                    tabIndex={0}
                    aria-label={destination}
                    onClick={() => {
                      setDestinationInput(destination);
                      onFilterChange({ ...safeFilters, destination });
                      setOpenDropdown(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        setDestinationInput(destination);
                        onFilterChange({ ...safeFilters, destination });
                        setOpenDropdown(null);
                      }
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
                ))
            ) : (
              <div className="px-4 py-2 text-sm text-muted-foreground">
                No matches
              </div>
            )}
          </div>
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
            className="rounded-full border-primary/30 bg-card  px-4 py-2 text-primary font-medium flex items-center justify-between focus:outline-none focus:ring-0 focus:ring-transparent"
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

      {/* Only show these filters in traveler mode */}
      {mode === "traveler" && (
        <>
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
            <DropdownMenuContent className="p-4 min-w-[350px] backdrop-blur-2xl bg-white/50 rounded-2xl shadow-md transition-all duration-300 ease-in-out border-none">
              <Slider
                value={ageRange}
                onChange={(value: number | number[]) => {
                  if (Array.isArray(value) && value.length === 2) {
                    handleAgeRangeChange([value[0], value[1]]);
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
                className="rounded-full border-primary/30 bg-card px-4 py-2 text-primary font-medium flex items-center justify-between focus:outline-none focus:ring-0 focus:ring-transparent"
                aria-label="Gender filter"
              >
                {getGenderLabel()}
                <ChevronDown className="ml-2 w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="p-3 min-w-[140px] backdrop-blur-2xl bg-white/50 rounded-2xl shadow-md transition-all duration-300 ease-in-out border-none">
              {GENDER_OPTIONS.filter((option) => option !== "Any").map(
                (option) => (
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
                )
              )}
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
                className="rounded-full border-primary/30 bg-card px-4 py-2 text-primary font-medium flex items-center justify-between focus:outline-none focus:ring-0 focus:ring-transparent"
                aria-label="Interests filter"
              >
                Interests
                <ChevronDown className="ml-2 w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="p-3 min-w-[220px] backdrop-blur-2xl bg-white/50 rounded-2xl shadow-md transition-all duration-300 ease-in-out border-none ">
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
        </>
      )}
    </section>
  );
};

export default ExploreFilters;
