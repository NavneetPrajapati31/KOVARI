// -----------------------------------------------------------------------------
//   File : Solo Explore UI Component
// -----------------------------------------------------------------------------
// Location: /src/features/explore/components/SoloExploreUI.tsx

"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Slider } from "@heroui/react";
import { Calendar, Filter, MapPin, Users, CalendarDays, DollarSign } from "lucide-react";
import { SoloMatchCard } from "./SoloMatchCard";

interface SearchData {
  destination: string;
  budget: number;
  startDate: Date;
  endDate: Date;
}

interface SoloExploreUIProps {
  onSearch: (searchData: SearchData) => void;
  matchedGroups: any[];
  currentGroupIndex: number;
  onPreviousGroup: () => void;
  onNextGroup: () => void;
  searchLoading: boolean;
  searchError: string | null;
  lastSearchData: SearchData | null;
}

export function SoloExploreUI({
  onSearch,
  matchedGroups,
  currentGroupIndex,
  onPreviousGroup,
  onNextGroup,
  searchLoading,
  searchError,
  lastSearchData
}: SoloExploreUIProps) {
  const [searchData, setSearchData] = useState<SearchData>({
    destination: "",
    budget: 20000,
    startDate: new Date(),
    endDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
  });

  const [filters, setFilters] = useState({
    ageRange: [18, 65],
    gender: "Any",
    interests: [] as string[],
    travelStyle: "Any",
    budgetRange: [5000, 50000],
  });

  const handleSearch = () => {
    onSearch(searchData);
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const INTEREST_OPTIONS = [
    "Adventure", "Culture", "Food", "Nature", 
    "Nightlife", "Relaxation", "Shopping", "Sports"
  ];

  const TRAVEL_STYLE_OPTIONS = [
    "Any", "Budget", "Mid-range", "Luxury", "Backpacker"
  ];

  const GENDER_OPTIONS = ["Any", "Male", "Female", "Other"];

  // Prevent body scrolling when component mounts
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden" style={{ height: '100vh', maxHeight: '100vh' }}>
      {/* Sidebar - Filters */}
      <div className="w-1/4 bg-white border-r border-gray-200 p-6 overflow-y-auto">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </h2>
        </div>

        {/* Search Form */}
        <div className="space-y-6">
          {/* Destination */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Destination
            </label>
            <input
              type="text"
              value={searchData.destination}
              onChange={(e) => setSearchData(prev => ({ ...prev, destination: e.target.value }))}
              placeholder="Where do you want to go?"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <CalendarDays className="w-4 h-4" />
                Departure
              </label>
              <input
                type="date"
                value={searchData.startDate.toISOString().split('T')[0]}
                onChange={(e) => setSearchData(prev => ({ ...prev, startDate: new Date(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <CalendarDays className="w-4 h-4" />
                Return
              </label>
              <input
                type="date"
                value={searchData.endDate.toISOString().split('T')[0]}
                onChange={(e) => setSearchData(prev => ({ ...prev, endDate: new Date(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Budget Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Budget Range
            </label>
            <div className="px-2">
              <Slider
                size="sm"
                step={1000}
                minValue={5000}
                maxValue={50000}
                value={[searchData.budget]}
                onChange={(value) => setSearchData(prev => ({ ...prev, budget: Array.isArray(value) ? value[0] : value }))}
                className="w-full"
                color="primary"
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>₹5,000</span>
              <span>₹{searchData.budget.toLocaleString()}</span>
              <span>₹50,000+</span>
            </div>
          </div>

          {/* Quick Budget Buttons */}
          <div className="flex flex-wrap gap-2">
            {[10000, 20000, 35000, 50000].map((budget) => (
              <Button
                key={budget}
                variant={searchData.budget === budget ? "default" : "outline"}
                size="sm"
                onClick={() => setSearchData(prev => ({ ...prev, budget }))}
                className="text-xs"
              >
                {budget === 50000 ? "Luxury ₹50k+" : `₹${budget.toLocaleString()}`}
              </Button>
            ))}
          </div>

          {/* Search Button */}
          <Button
            onClick={handleSearch}
            disabled={searchLoading || !searchData.destination}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
          >
            {searchLoading ? "Searching..." : "SEARCH"}
          </Button>
        </div>

        {/* Additional Filters */}
        <div className="mt-8 space-y-6">
          <h3 className="text-lg font-medium text-gray-900">Additional Filters</h3>

          {/* Age Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Age Range: {filters.ageRange[0]} - {filters.ageRange[1]}
            </label>
            <Slider
              size="sm"
              step={1}
              minValue={18}
              maxValue={80}
              value={filters.ageRange}
              onChange={(value) => handleFilterChange('ageRange', Array.isArray(value) ? value : [value, value])}
              className="w-full"
              color="primary"
            />
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gender Preference
            </label>
            <select
              value={filters.gender}
              onChange={(e) => handleFilterChange('gender', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {GENDER_OPTIONS.map((gender) => (
                <option key={gender} value={gender}>{gender}</option>
              ))}
            </select>
          </div>

          {/* Travel Style */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Travel Style
            </label>
            <select
              value={filters.travelStyle}
              onChange={(e) => handleFilterChange('travelStyle', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {TRAVEL_STYLE_OPTIONS.map((style) => (
                <option key={style} value={style}>{style}</option>
              ))}
            </select>
          </div>

          {/* Interests */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Interests
            </label>
            <div className="flex flex-wrap gap-2">
              {INTEREST_OPTIONS.map((interest) => (
                <Badge
                  key={interest}
                  variant={filters.interests.includes(interest) ? "default" : "outline"}
                  className="cursor-pointer hover:bg-blue-50"
                  onClick={() => {
                    const newInterests = filters.interests.includes(interest)
                      ? filters.interests.filter(i => i !== interest)
                      : [...filters.interests, interest];
                    handleFilterChange('interests', newInterests);
                  }}
                >
                  {interest}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

                           {/* Main Content - User Matched Cards */}
        <div className="flex-1 flex flex-col overflow-hidden h-full">
          {/* Error Display */}
          {searchError && (
            <div className="mx-4 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex-shrink-0">
              <p className="text-red-600 text-sm">{searchError}</p>
            </div>
          )}

          {/* Results Display */}
          {matchedGroups.length > 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Navigation arrows */}
            {matchedGroups.length > 1 && (
              <>
                                <button
                  onClick={onPreviousGroup}
                  disabled={currentGroupIndex === 0}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 bg-white/40 backdrop-blur-sm border border-gray-200/50 rounded-full p-3 hover:bg-white/60 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
                  aria-label="Previous match"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                </button>
                <button
                  onClick={onNextGroup}
                  disabled={currentGroupIndex === matchedGroups.length - 1}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 bg-white/40 backdrop-blur-sm border border-gray-200/50 rounded-full p-3 hover:bg-white/60 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
                  aria-label="Next match"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m9 18 6-6-6-6" />
                </svg>
                </button>
              </>
            )}
            
            {/* Current match */}
                         <SoloMatchCard
               key={matchedGroups[currentGroupIndex].id}
               match={matchedGroups[currentGroupIndex]}
               onConnect={async (matchId) => {
                 console.log("Connecting with solo traveler:", matchId);
                 // TODO: Implement connection logic
               }}
               onSuperLike={async (matchId) => {
                 console.log("Super liking solo traveler:", matchId);
                 // TODO: Implement super like logic
               }}
               onPass={async (matchId) => {
                 console.log("Passing on solo traveler:", matchId);
                 // TODO: Implement pass logic - move to next match
                 onNextGroup();
               }}
               onComment={async (matchId, attribute, comment) => {
                 console.log("Commenting on", attribute, "for traveler:", matchId, "Comment:", comment);
                 // TODO: Implement comment logic
               }}
               onViewProfile={(userId) => {
                 console.log("Viewing profile:", userId);
                 // TODO: Navigate to user profile
               }}
             />
            
            {/* Match counter */}
            {matchedGroups.length > 1 && (
              <div className="flex items-center gap-2 mt-6 text-sm text-gray-600">
                <span className="font-medium">{currentGroupIndex + 1}</span>
                <span>of</span>
                <span className="font-medium">{matchedGroups.length}</span>
                <span>travelers</span>
              </div>
            )}
          </div>
                 ) : (
           /* No Results or Initial State */
           <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-hidden">
            {lastSearchData ? (
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">No matches found</h3>
                <p className="text-gray-600 mb-6 max-w-md">
                  Try adjusting your search criteria or dates to find more travel companions.
                </p>
                <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
                  <p><strong>Destination:</strong> {lastSearchData.destination}</p>
                  <p><strong>Budget:</strong> ₹{lastSearchData.budget.toLocaleString()}</p>
                  <p><strong>Dates:</strong> {lastSearchData.startDate.toLocaleDateString()} - {lastSearchData.endDate.toLocaleDateString()}</p>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-12 h-12 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Start your search</h3>
                <p className="text-gray-600 max-w-md">
                  Enter your travel details in the sidebar to find compatible travel companions.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
