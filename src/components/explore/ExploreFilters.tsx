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
import { CalendarDate } from "@internationalized/date";
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
  onFilterChange?: (filters: FiltersState) => void;
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
function calendarDateToDate(cd: CalendarDate | null): Date | undefined {
  if (!cd) return undefined;
  return new Date(Date.UTC(cd.year, cd.month - 1, cd.day));
}

const ExploreFilters: React.FC<ExploreFiltersProps> = ({ onFilterChange }) => {
  // Use CalendarDate for HeroUI DatePicker
  const [dateStart, setDateStart] = useState<CalendarDate | null>(null);
  const [dateEnd, setDateEnd] = useState<CalendarDate | null>(null);
  const [filters, setFilters] = useState<FiltersState>(DEFAULT_FILTERS);
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(
    null
  );
  // Track which dropdown is open
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Sync CalendarDate to Date in filters
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      dateStart: calendarDateToDate(dateStart),
      dateEnd: calendarDateToDate(dateEnd),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateStart, dateEnd]);

  // Debounced filter callback
  useEffect(() => {
    if (debounceTimeout) clearTimeout(debounceTimeout);
    const timeout = setTimeout(() => {
      if (onFilterChange) onFilterChange(filters);
      // For mock: log filters
      if (!onFilterChange) console.log("Filters:", filters);
    }, DEBOUNCE_MS);
    setDebounceTimeout(timeout);
    return () => clearTimeout(timeout);
  }, [filters, debounceTimeout, onFilterChange]);

  // Handlers
  const handleDestinationSelect = (destination: string) => {
    setFilters((prev) => ({ ...prev, destination }));
  };

  const handleDateStartChange = (date: CalendarDate | null) => {
    setDateStart(date);
  };
  const handleDateEndChange = (date: CalendarDate | null) => {
    setDateEnd(date);
  };

  const handleAgeMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(0, Math.min(Number(e.target.value), filters.ageMax));
    setFilters((prev) => ({ ...prev, ageMin: value }));
  };
  const handleAgeMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(filters.ageMin, Number(e.target.value));
    setFilters((prev) => ({ ...prev, ageMax: value }));
  };

  const handleGenderChange = (value: string) => {
    setFilters((prev) => ({ ...prev, gender: value }));
  };

  const handleInterestToggle = (interest: string) => {
    setFilters((prev) =>
      prev.interests.includes(interest)
        ? { ...prev, interests: prev.interests.filter((i) => i !== interest) }
        : { ...prev, interests: [...prev.interests, interest] }
    );
  };

  // Filter summary helpers
  const getDateRangeLabel = () => {
    const format = (cd: CalendarDate | null) => {
      if (!cd) return "";
      const d = calendarDateToDate(cd);
      return d ? d.toLocaleDateString() : "";
    };
    if (!dateStart && !dateEnd) return "Date Range";
    if (dateStart && dateEnd) {
      return `${format(dateStart)} - ${format(dateEnd)}`;
    }
    if (dateStart) return `From ${format(dateStart)}`;
    if (dateEnd) return `Until ${format(dateEnd)}`;
    return "Date Range";
  };
  const getAgeRangeLabel = () => {
    if (filters.ageMin === 18 && filters.ageMax === 99) return "Age Range";
    return `${filters.ageMin} - ${filters.ageMax}`;
  };
  const getGenderLabel = () =>
    !filters.gender || filters.gender === "Any" ? "Gender" : filters.gender;
  const getInterestsLabel = () =>
    filters.interests.length === 0 ? "Interests" : filters.interests.join(", ");
  const getDestinationLabel = () =>
    !filters.destination || filters.destination === "Any"
      ? "Destination"
      : filters.destination;

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
              aria-pressed={filters.destination === destination}
              tabIndex={0}
              aria-label={destination}
              onClick={() => handleDestinationSelect(destination)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ")
                  handleDestinationSelect(destination);
              }}
            >
              {destination}
              {filters.destination === destination && (
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
            {getDateRangeLabel()}
            <ChevronDown className="ml-2 w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="min-w-[250px] backdrop-blur-2xl bg-white/50 rounded-2xl shadow-md transition-all duration-300 ease-in-out border-none">
          <div>
            <RangeCalendar
              aria-label="Date (Uncontrolled)"
              defaultValue={{
                start: today(getLocalTimeZone()),
                end: today(getLocalTimeZone()).add({ weeks: 1 }),
              }}
              minValue={today(getLocalTimeZone())}
              classNames={{
                base: cn("bg-transparent"),
                headerWrapper: cn("bg-transparent"),
                gridHeader: cn("bg-transparent"),
              }}
            />

            {/* <label className="text-xs font-medium text-foreground mb-1 block">
              Date Range
            </label> */}

            {/* <div className="flex flex-col gap-2">
              <DatePicker
                value={dateStart}
                onChange={handleDateStartChange}
                variant="underlined"
              />
              <span className="text-xs text-foreground self-center">to</span>
              <DatePicker
                value={dateEnd}
                onChange={handleDateEndChange}
                variant="underlined"
              />
            </div> */}
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
            {getAgeRangeLabel()}
            <ChevronDown className="ml-2 w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="p-4 min-w-[250px] backdrop-blur-2xl bg-white/50 rounded-2xl shadow-md transition-all duration-300 ease-in-out border-none">
          <Slider
            className="max-w-lg"
            defaultValue={[18, 30]}
            formatOptions={{ style: "decimal" }}
            label="Age Range"
            maxValue={100}
            minValue={18}
            step={1}
            size="sm"
          />
          {/* <div className="flex flex-col gap-4">
            <div className="flex w-full flex-col md:flex-nowrap mb-6 md:mb-0 gap-4">
              <NumberInput placeholder="18" variant="underlined" hideStepper />
              <NumberInput placeholder="25" variant="underlined" hideStepper />
            </div>
          </div> */}
          {/*  <div>
             <label className="text-xs font-medium text-primary mb-1 block">
              Age Range
            </label>
            <div className="flex gap-2 items-center">
              <Input
                type="number"
                min={0}
                max={filters.ageMax}
                value={filters.ageMin}
                onChange={handleAgeMinChange}
                className="w-14 bg-card border border-primary/30 rounded-full px-2 py-1 text-center focus:border-primary"
                aria-label="Minimum age"
              />
              <span className="text-xs text-primary">-</span>
              <Input
                type="number"
                min={filters.ageMin}
                max={99}
                value={filters.ageMax}
                onChange={handleAgeMaxChange}
                className="w-14 bg-card border border-primary/30 rounded-full px-2 py-1 text-center focus:border-primary"
                aria-label="Maximum age"
              />
            </div> 
          </div>*/}
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
              aria-pressed={filters.gender === option}
              tabIndex={0}
              aria-label={option}
              onClick={() => handleGenderChange(option)}
            >
              {option}
              {filters.gender === option && (
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
              aria-pressed={filters.interests.includes(interest)}
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
              {filters.interests.includes(interest) && (
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
