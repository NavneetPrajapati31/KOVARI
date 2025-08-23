// -----------------------------------------------------------------------------
//   File : Solo Explore UI Component
// -----------------------------------------------------------------------------
// Location: /src/features/explore/components/SoloExploreUI.tsx

"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Switch } from "@/shared/components/ui/switch";
import { Slider } from "@heroui/react";
import { Calendar, Filter, MapPin, Users, CalendarDays, DollarSign } from "lucide-react";
import { SoloMatchCard } from "./SoloMatchCard";

interface SearchData {
  destination: string;
  budget: number;
  startDate: Date;
  endDate: Date;
  travelMode: "solo" | "group";
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
    travelMode: "solo",
  });

  const [filters, setFilters] = useState({
    ageRange: [18, 65],
    gender: "Any",
    interests: [] as string[],
    travelStyle: "Any",
    budgetRange: [5000, 50000],
    personality: "Any",
    smoking: "No",
    drinking: "No",
    nationality: "Any",
    languages: [] as string[],
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

  const PERSONALITY_OPTIONS = ["Any", "Extrovert", "Introvert", "Ambivert"];
  const NATIONALITY_OPTIONS = [
    "Any", "Indian", "American", "British", "Canadian", "Australian", 
    "German", "French", "Japanese", "Chinese", "Korean", "Singaporean", 
    "Thai", "Vietnamese", "Indonesian", "Malaysian", "Filipino", "Other"
  ];
  const LANGUAGE_OPTIONS = [
    "Any", "English", "Hindi", "Spanish", "French", "German", "Italian", 
    "Portuguese", "Russian", "Chinese", "Japanese", "Korean", "Arabic", 
    "Thai", "Vietnamese", "Indonesian", "Malay", "Tagalog", "Other"
  ];

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
         <div className="flex h-screen bg-background overflow-hidden">
       {/* Left Sidebar */}
       <div className="w-1/4 bg-background border-r border-gray-200 flex flex-col">
        {/* Component 1: Solo/Group Selection - Fixed at top */}
        <div className="p-4 bg-background flex-shrink-0">
                     <div className="flex bg-background rounded-lg p-1 shadow-sm border border-gray-200">
            <button
              onClick={() => setSearchData(prev => ({ ...prev, travelMode: "solo" }))}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                searchData.travelMode === "solo"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              Solo
            </button>
            <button
              onClick={() => setSearchData(prev => ({ ...prev, travelMode: "group" }))}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                searchData.travelMode === "group"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              Group
            </button>
          </div>
        </div>

        {/* Component 2: Filters with Scrollbar - Scrollable area */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </h2>
          </div>

          {/* Search Form */}
          <div className="space-y-6 pb-6 border-b border-gray-200">
            {/* Destination */}
            <div className="space-y-2">
              <Label htmlFor="destination" className="text-base font-medium text-gray-900 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Destination
              </Label>
              <Input
                id="destination"
                type="text"
                value={searchData.destination}
                onChange={(e) => setSearchData(prev => ({ ...prev, destination: e.target.value }))}
                placeholder="Where do you want to go?"
                className="w-full"
              />
            </div>

            {/* Dates */}
            <div className="space-y-2">
              <Label className="text-base font-medium text-gray-900">Travel Dates</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="startDate" className="text-sm text-gray-700 flex items-center gap-2">
                    <CalendarDays className="w-4 h-4" />
                    Departure
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={searchData.startDate.toISOString().split('T')[0]}
                    onChange={(e) => setSearchData(prev => ({ ...prev, startDate: new Date(e.target.value) }))}
                    className="w-full"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="endDate" className="text-sm text-gray-700 flex items-center gap-2">
                    <CalendarDays className="w-4 h-4" />
                    Return
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={searchData.endDate.toISOString().split('T')[0]}
                    onChange={(e) => setSearchData(prev => ({ ...prev, endDate: new Date(e.target.value) }))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

                         {/* Budget Range */}
             <div className="space-y-2">
               <Label className="text-base font-medium text-gray-900">
                 Budget Range
               </Label>
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
            <div className="space-y-2">
              <Label className="text-sm text-gray-700">Quick Select</Label>
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
           <div className="pt-6 space-y-6">
             <h3 className="text-lg font-medium text-gray-900">Additional Filters</h3>

             {/* 1. Age Range */}
             <div className="space-y-2">
               <Label className="text-base font-medium text-gray-900">
                 Age Range: {filters.ageRange[0]} - {filters.ageRange[1]}
               </Label>
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

             {/* 2. Gender */}
             <div className="space-y-2">
               <Label htmlFor="gender" className="text-base font-medium text-gray-900">Gender Preference</Label>
               <Select value={filters.gender} onValueChange={(value) => handleFilterChange('gender', value)}>
                 <SelectTrigger className="w-full">
                   <SelectValue placeholder="Select gender" />
                 </SelectTrigger>
                 <SelectContent>
                   {GENDER_OPTIONS.map((gender) => (
                     <SelectItem key={gender} value={gender}>
                       {gender}
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>

             {/* 3. Personality */}
             <div className="space-y-2">
               <Label htmlFor="personality" className="text-base font-medium text-gray-900">Personality</Label>
               <Select value={filters.personality} onValueChange={(value) => handleFilterChange('personality', value)}>
                 <SelectTrigger className="w-full">
                   <SelectValue placeholder="Select personality" />
                 </SelectTrigger>
                 <SelectContent>
                   {PERSONALITY_OPTIONS.map((personality) => (
                     <SelectItem key={personality} value={personality}>
                       {personality}
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>

             {/* 4. Interests */}
             <div className="space-y-2">
               <Label className="text-base font-medium text-gray-900">Interests</Label>
               <div className="flex flex-wrap gap-2">
                 {INTEREST_OPTIONS.map((interest) => (
                   <Badge
                     key={interest}
                     variant={filters.interests.includes(interest) ? "default" : "outline"}
                     className="cursor-pointer hover:bg-blue-50 rounded-full px-3 py-1 transition-all duration-200 hover:scale-105"
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

             {/* 5. Languages */}
             <div className="space-y-2">
               <Label className="text-base font-medium text-gray-900">Languages</Label>
               <div className="flex flex-wrap gap-2">
                 {LANGUAGE_OPTIONS.map((language) => (
                   <Badge
                     key={language}
                     variant={filters.languages.includes(language) ? "default" : "outline"}
                     className="cursor-pointer hover:bg-blue-50 rounded-full px-3 py-1 transition-all duration-200 hover:scale-105"
                     onClick={() => {
                       const newLanguages = filters.languages.includes(language)
                         ? filters.languages.filter(l => l !== language)
                         : [...filters.languages, language];
                       handleFilterChange('languages', newLanguages);
                     }}
                   >
                     {language}
                   </Badge>
                 ))}
               </div>
             </div>

             {/* 6. Smoking */}
             <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50/50">
               <div className="space-y-1">
                 <Label htmlFor="smoking" className="text-base font-medium text-gray-900">Smoking</Label>
                 <p className="text-sm text-gray-600">
                   {filters.smoking === "Yes" ? "Comfortable with smokers" : "Non-smoking preferred"}
                 </p>
               </div>
               <Switch
                 id="smoking"
                 checked={filters.smoking === "Yes"}
                 onCheckedChange={(checked) => handleFilterChange('smoking', checked ? "Yes" : "No")}
                 className="data-[state=checked]:bg-blue-600"
               />
             </div>

             {/* 7. Drinking */}
             <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50/50">
               <div className="space-y-1">
                 <Label htmlFor="drinking" className="text-base font-medium text-gray-900">Drinking</Label>
                 <p className="text-sm text-gray-600">
                   {filters.drinking === "Yes" ? "Comfortable with drinkers" : "Non-drinking preferred"}
                 </p>
               </div>
               <Switch
                 id="drinking"
                 checked={filters.drinking === "Yes"}
                 onCheckedChange={(checked) => handleFilterChange('drinking', checked ? "Yes" : "No")}
                 className="data-[state=checked]:bg-blue-600"
               />
             </div>

             {/* 8. Nationality */}
             <div className="space-y-2">
               <Label htmlFor="nationality" className="text-base font-medium text-gray-900">Nationality</Label>
               <Select value={filters.nationality} onValueChange={(value) => handleFilterChange('nationality', value)}>
                 <SelectTrigger className="w-full">
                   <SelectValue placeholder="Select nationality" />
                 </SelectTrigger>
                 <SelectContent>
                   {NATIONALITY_OPTIONS.map((nationality) => (
                     <SelectItem key={nationality} value={nationality}>
                       {nationality}
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
            
            {/* Bottom Spacing */}
            <div className="h-10"></div>
          </div>
        </div>
      </div>

      {/* Component 3: Solo Matched User Card */}
      <div className="flex-1 bg-background overflow-hidden">
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
                                     className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 bg-background/40 backdrop-blur-sm border border-gray-200/50 rounded-full p-3 hover:bg-background/60 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
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
                                     className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 bg-background/40 backdrop-blur-sm border border-gray-200/50 rounded-full p-3 hover:bg-background/60 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
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
                                 <div className="bg-background rounded-lg p-4 text-sm text-gray-600">
                  <p><strong>Destination:</strong> {lastSearchData.destination}</p>
                  <p><strong>Budget:</strong> ₹{lastSearchData.budget.toLocaleString()}</p>
                  <p><strong>Dates:</strong> {lastSearchData.startDate.toLocaleDateString()} - {lastSearchData.endDate.toLocaleDateString()}</p>
                </div>
              </div>
            ) : (
              <div className="text-center">
                                 <div className="w-24 h-24 bg-background rounded-full flex items-center justify-center mx-auto mb-4">
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
