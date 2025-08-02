
"use client"

import { useState } from "react"
import { ChevronDown, Plane, Search } from "lucide-react"
import { Button } from "@/shared/components/ui/button"
import { Label } from "@/shared/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover"
import { Calendar as CalendarComponent } from "@/shared/components/ui/calendar"
import { Input } from "@/shared/components/ui/input"
import { format } from "date-fns"
import { budgetPresets, budgetMarks, BudgetPreset, CityType, popularCities } from "@/features/explore/components/ExploreFilter"

interface ExploreHeaderProps {
  activeTab: number;
  onTabChange: (index: number) => void;
  onDropdownOpenChange: (open: boolean) => void;
  onSearch?: (data: {
    destination: string;
    budget: number;
    startDate: Date;
    endDate: Date;
  }) => void;
}

export function ExploreHeader({ activeTab, onTabChange, onDropdownOpenChange, onSearch }: ExploreHeaderProps) {
  // Remove local travelType state
  const [fromCity, setFromCity] = useState("Delhi")
  const [toCity, setToCity] = useState("Jaipur")
  const [showFromDropdown, setShowFromDropdown] = useState(false)
  const [showToDropdown, setShowToDropdown] = useState(false)
  const [departureDate, setDepartureDate] = useState<Date>(new Date())
  const [returnDate, setReturnDate] = useState<Date>()

  const [budget, setBudget] = useState(25000)

  // Removed local budgetPresets and budgetMarks, now imported

  const minBudget = 5000;
  const maxBudget = 50000;
  const percent = ((budget - minBudget) / (maxBudget - minBudget)) * 100;

  const sliderStyle = {
    background: `linear-gradient(to right, #2563eb ${percent}%, #e5e7eb ${percent}%)`
  };

  const formatBudget = (val: number) =>
    val >= 50000 ? "₹50,000+" : `₹${val.toLocaleString()}`

  const handleDepartureDateChange = (date: Date) => {
    setDepartureDate(date);
    if (returnDate && date >= returnDate) {
      setReturnDate(undefined);
    }
  };

  const handleSearchClick = () => {
    if (onSearch) {
      onSearch({
        destination: toCity,
        budget,
        startDate: departureDate,
        endDate: returnDate || departureDate,
      });
    }
  };

  return (
    <div className="bg-gray-50">
      <div className="max-w-7xl mx-auto p-2 space-y-2">
        {/* Travel Type Selection */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sm:gap-2">
          <div className="flex items-center gap-2 sm:gap-3">
            <label className="flex items-center gap-1">
              <input
                type="radio"
                name="travelType"
                value="solo"
                checked={activeTab === 0}
                onChange={() => onTabChange(0)}
                className="text-blue-600 h-4 w-4"
                aria-label="Solo travel type"
              />
              <span className="font-medium text-sm">Solo</span>
            </label>
            <label className="flex items-center gap-1">
              <input
                type="radio"
                name="travelType"
                value="group"
                checked={activeTab === 1}
                onChange={() => onTabChange(1)}
                className="text-blue-600 h-4 w-4"
                aria-label="Group travel type"
              />
              <span className="font-medium text-sm">Group</span>
            </label>
          </div>
        </div>

        {/* Main Traveler Search */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-gray-200">
            {/* From */}
            <div className="col-span-1 md:col-span-3 p-2 md:p-3 relative">
              <Label className="text-xs text-blue-600 mb-1 block">From</Label>
              <Popover open={showFromDropdown} onOpenChange={setShowFromDropdown}>
                <PopoverTrigger asChild>
                  <div className="w-full cursor-pointer">
                    <div className="space-y-1 text-left w-full">
                      <div className="flex items-center gap-2 w-full">
                        <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <Input
                          placeholder="From"
                          value={fromCity}
                          readOnly
                          className="border-none p-0 text-base lg:text-lg font-medium focus-visible:ring-0 min-w-0 bg-transparent cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-96 p-0" align="start">
                  <div className="p-4">
                    <div className="text-sm text-gray-600 mb-3 flex items-center gap-2">
                      <span>POPULAR CITIES</span>
                    </div>
                    <div className="space-y-2">
                      {popularCities.map((city: CityType, index: number) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 hover:bg-gray-520 rounded cursor-pointer"
                          onClick={() => {
                            setFromCity(city.name)
                            setShowFromDropdown(false)
                          }}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="font-medium truncate">{city.name}</div>
                            {/* Removed airport display */}
                          </div>
                          <div className="text-sm font-medium text-gray-600 ml-2 flex-shrink-0">{city.code}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* To */}
            <div className="col-span-1 md:col-span-3 p-2 md:p-3 relative">
              <Label className="text-xs text-gray-600 mb-1 block">To</Label>
              <Popover open={showToDropdown} onOpenChange={setShowToDropdown}>
                <PopoverTrigger asChild>
                  <div className="w-full cursor-pointer">
                    <div className="space-y-1 text-left w-full">
                      <div className="flex items-center gap-2 w-full">
                        <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <Input
                          placeholder="To"
                          value={toCity}
                          readOnly
                          className="border-none p-0 text-base lg:text-lg font-medium focus-visible:ring-0 min-w-0 bg-transparent cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-96 p-0" align="start">
                  <div className="p-4">
                    <div className="text-sm text-gray-600 mb-3 flex items-center gap-2">
                      <span>POPULAR CITIES</span>
                    </div>
                    <div className="space-y-2">
                      {popularCities.map((city: CityType, index: number) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                          onClick={() => {
                            setToCity(city.name)
                            setShowToDropdown(false)
                          }}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="font-medium truncate">{city.name}</div>
                            {/* Removed airport display */}
                          </div>
                          <div className="text-sm font-medium text-gray-600 ml-2 flex-shrink-0">{city.code}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Departure */}
            <div className="col-span-1 md:col-span-2 p-2 md:p-3">
              <Label className="text-xs text-blue-600 mb-1 flex items-center gap-1">
                Departure <ChevronDown className="h-3 w-3" />
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <div className="w-full cursor-pointer">
                    <div className="space-y-1 text-left w-full">
                      <div className="text-lg lg:text-2xl font-bold truncate">
                        {format(departureDate, "dd MMM yy")}
                      </div>
                      <div className="text-sm text-gray-500 truncate">
                        {format(departureDate, "EEEE")}
                      </div>
                    </div>
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent mode="single" selected={departureDate} onSelect={(date) => date && handleDepartureDateChange(date)} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            {/* Return */}
            <div className="col-span-1 md:col-span-2 p-2 md:p-3">
              <Label className="text-xs text-blue-600 mb-1 flex items-center gap-1">
                Return <ChevronDown className="h-3 w-3" />
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <div className="w-full cursor-pointer">
                    <div className="space-y-1 text-left w-full">
                      {returnDate ? (
                        <>
                          <div className="text-lg lg:text-2xl font-bold truncate">
                            {format(returnDate, "dd MMM yy")}
                          </div>
                          <div className="text-sm text-gray-500 truncate">{format(returnDate, "EEEE")}</div>
                        </>
                      ) : (
                        <div className="text-sm text-gray-500 leading-tight break-words">
                          Tap to add a return date 
                        </div>
                      )}
                    </div>
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={returnDate}
                    onSelect={(date) => date && setReturnDate(date)}
                    initialFocus
                    disabled={(date) => !date || date <= departureDate}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        {/* Budget Section */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden mt-2 p-2">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-3">
            {/* Left: Title, Slider, Marks */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 mb-1">
                <span className="text-lg">💰</span>
                <span className="font-bold text-base">Budget Range</span>
              </div>
              <div className="flex flex-col gap-1">
                {/* Slider */}
                <input
                  type="range"
                  min={minBudget}
                  max={maxBudget}
                  step={1000}
                  value={budget}
                  onChange={e => setBudget(Number(e.target.value))}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-blue-600 transition-all duration-200"
                  aria-label="Budget range slider"
                  style={sliderStyle}
                />
                {/* Marks */}
                <div className="flex justify-between text-gray-500 text-xs mt-0.5 select-none">
                  {budgetMarks.map((mark: number) => (
                    <span key={mark}>{formatBudget(mark)}</span>
                  ))}
                </div>
              </div>
            </div>
            {/* Right: Presets & Badge */}
            <div className="flex flex-col items-end gap-1 md:gap-2 min-w-[120px] md:min-w-[160px] w-full md:w-auto">
              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 md:px-3 rounded-full font-semibold text-xs md:text-sm mb-1 md:mb-1 w-full md:w-auto text-center">
                Up to {formatBudget(budget)}
              </span>
              <div className="grid grid-cols-2 gap-1 w-full">
                {budgetPresets.map((preset: BudgetPreset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setBudget(preset.value)}
                    className={`border rounded-lg px-2 py-1 font-medium text-xs transition-colors
                      ${budget === preset.value ? "bg-blue-50 border-blue-600 text-blue-700" : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"}`}
                    aria-pressed={budget === preset.value}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Search Button */}
        <div className="flex justify-center mt-2">
          <Button
            className="w-full sm:w-auto px-4 sm:px-6 lg:px-10 py-2 sm:py-3 text-sm sm:text-base lg:text-lg font-bold bg-blue-600 hover:bg-blue-700 rounded-full"
            onClick={handleSearchClick}
          >
            SEARCH
          </Button>
        </div>
      </div>
    </div>
  )
}
