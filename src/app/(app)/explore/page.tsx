"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { SoloMatchCard } from "@/features/explore/components/SoloMatchCard";
import { GroupMatchCard } from "@/features/explore/components/GroupMatchCard";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Switch } from "@/shared/components/ui/switch";
import { Slider } from "@heroui/react";
import { Calendar, Filter, MapPin, Users, CalendarDays, DollarSign } from "lucide-react";
import { Spinner } from "@heroui/react";

// Define the search data interface
interface SearchData {
  destination: string;
  budget: number;
  startDate: Date;
  endDate: Date;
  travelMode: "solo" | "group";
}

export default function ExplorePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();

  // Helper to get tab index from URL
  const getTabIndex = () => {
    const tab = searchParams.get("tab");
    if (tab === "groups") return 1;
    return 0;
  };

  const [activeTab, setActiveTab] = useState(getTabIndex);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [matchedGroups, setMatchedGroups] = useState<any[]>([]);
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [lastSearchData, setLastSearchData] = useState<SearchData | null>(null);

  // Search form state
  const [searchData, setSearchData] = useState<SearchData>({
    destination: "",
    budget: 20000,
    startDate: new Date(),
    endDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
    travelMode: activeTab === 0 ? "solo" : "group",
  });

  const [showDestinationDropdown, setShowDestinationDropdown] = useState(false);

  // Filters state
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

  // Constants
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

  const DESTINATION_OPTIONS = [
    "Abu Dhabi, UAE", "Adelaide, Australia", "Agra, India", "Ahmedabad, Gujarat", "Aihole, Karnataka",
    "Ajmer, Rajasthan", "Alexandria, Egypt", "Almora, Uttarakhand", "Amboli, Maharashtra", "Amman, Jordan",
    "Amsterdam, Netherlands", "Antwerp, Belgium", "Arambol, Goa", "Athens, Greece", "Auckland, New Zealand",
    "Auli, Uttarakhand", "Badami, Karnataka", "Badrinath, Uttarakhand", "Bali, Indonesia", "Bangalore, Karnataka",
    "Bangkok, Thailand", "Barcelona, Spain", "Bekal, Kerala", "Berlin, Germany", "Bhandardara, Maharashtra",
    "Bharatpur, Rajasthan", "Bhimashankar, Maharashtra", "Bhopal, Madhya Pradesh", "Bhuj, Gujarat", "Bidar, Karnataka",
    "Bikaner, Rajasthan", "Binsar, Uttarakhand", "Birmingham, UK", "Bogota, Colombia", "Bordeaux, France",
    "Brisbane, Australia", "Brussels, Belgium", "Budapest, Hungary", "Bundi, Rajasthan", "Busan, South Korea",
    "Cairo, Egypt", "Calgary, Canada", "Canberra, Australia", "Cape Town, South Africa", "Cartagena, Colombia",
    "Chandigarh, India", "Chennai, Tamil Nadu", "Chiang Mai, Thailand", "Chikhaldara, Maharashtra", "Coorg, Karnataka",
    "Copenhagen, Denmark", "Cusco, Peru", "Dalhousie, Himachal Pradesh", "Daman, Daman & Diu", "Darjeeling, West Bengal",
    "Delhi, India", "Dharamshala, Himachal Pradesh", "Diu, Daman & Diu", "Dubai, UAE", "Dublin, Ireland",
    "Dwarka, Gujarat", "Edinburgh, UK", "Florence, Italy", "Ganapatipule, Maharashtra", "Gangtok, Sikkim",
    "Geneva, Switzerland", "Girnar, Gujarat", "Goa, India", "Gokarna, Karnataka", "Graz, Austria",
    "Halebidu, Karnataka", "Hampi, Karnataka", "Haridwar, Uttarakhand", "Harishchandragad, Maharashtra", "Helsinki, Finland",
    "Hong Kong", "Hyderabad, Telangana", "Igatpuri, Maharashtra", "Innsbruck, Austria", "Istanbul, Turkey",
    "Jaipur, Rajasthan", "Jaisalmer, Rajasthan", "Jakarta, Indonesia", "Jibhi, Himachal Pradesh", "Jodhpur, Rajasthan",
    "Junagadh, Gujarat", "Kalsubai, Maharashtra", "Kanchipuram, Tamil Nadu", "Karjat, Maharashtra", "Kasol, Himachal Pradesh",
    "Kedarnath, Uttarakhand", "Khandala, Maharashtra", "Khirganga, Himachal Pradesh", "Kodaikanal, Tamil Nadu", "Kolkata, West Bengal",
    "Krakow, Poland", "Kuala Lumpur, Malaysia", "Kumta, Karnataka", "Kyoto, Japan", "Leh, Ladakh",
    "Lima, Peru", "Linz, Austria", "Lisbon, Portugal", "London, UK", "Lonavala, Maharashtra",
    "Los Angeles, USA", "Lucknow, Uttar Pradesh", "Madrid, Spain", "Mahabaleshwar, Maharashtra", "Malpe, Karnataka",
    "Malshej Ghat, Maharashtra", "Manali, Himachal Pradesh", "Manila, Philippines", "Mapusa, Goa", "Marrakech, Morocco",
    "Matheran, Maharashtra", "Melbourne, Australia", "Mumbai, Maharashtra", "Munnar, Kerala", "Murudeshwar, Karnataka",
    "Mussoorie, Uttarakhand", "Mysore, Karnataka", "Nainital, Uttarakhand", "Nairobi, Kenya", "New York City, USA",
    "Nice, France", "Ooty, Tamil Nadu", "Oslo, Norway", "Pachmarhi, Madhya Pradesh", "Palitana, Gujarat",
    "Panchgani, Maharashtra", "Paris, France", "Petra, Jordan", "Phuket, Thailand", "Prague, Czech Republic",
    "Pune, Maharashtra", "Pushkar, Rajasthan", "Raigad, Maharashtra", "Rajgir, Bihar", "Rishikesh, Uttarakhand",
    "Rome, Italy", "Salzburg, Austria", "San Francisco, USA", "Santorini, Greece", "Saputara, Gujarat",
    "Seoul, South Korea", "Shimla, Himachal Pradesh", "Singapore", "Spiti Valley, Himachal Pradesh", "Stockholm, Sweden",
    "Sydney, Australia", "Tadoba, Maharashtra", "Tawang, Arunachal Pradesh", "Tel Aviv, Israel", "Tokyo, Japan",
    "Toranmal, Maharashtra", "Udaipur, Rajasthan", "Udupi, Karnataka", "Ujjain, Madhya Pradesh", "Valley of Flowers, Uttarakhand",
    "Varanasi, Uttar Pradesh", "Vienna, Austria", "Visakhapatnam, Andhra Pradesh", "Wayanad, Kerala", "Yamunotri, Uttarakhand",
    "Zurich, Switzerland"
  ];

  useEffect(() => {
    const tabIndex = getTabIndex();
    if (activeTab !== tabIndex) {
      setActiveTab(tabIndex);
    }
  }, [searchParams]);

  const handleTabChange = (index: number) => {
    if (index !== activeTab) {
      setActiveTab(index);
      let newTab = "travelers";
      if (index === 1) newTab = "groups";
      router.push(`/explore?tab=${newTab}`, { scroll: false });
    }
  };

  // Navigation functions
  const handlePreviousGroup = () => {
    if (currentGroupIndex > 0) {
      setCurrentGroupIndex(currentGroupIndex - 1);
    }
  };

  const handleNextGroup = () => {
    if (currentGroupIndex < matchedGroups.length - 1) {
      setCurrentGroupIndex(currentGroupIndex + 1);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        handlePreviousGroup();
      } else if (event.key === "ArrowRight") {
        handleNextGroup();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [currentGroupIndex, matchedGroups.length]);

  // Page loading effect
  useEffect(() => {
    document.body.style.overflow = isPageLoading ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isPageLoading]);

  // Prevent body scrolling when component mounts
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  // Close destination dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.destination-dropdown-container')) {
        setShowDestinationDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync travelMode with activeTab when it changes
  useEffect(() => {
    setSearchData(prev => ({
      ...prev,
      travelMode: activeTab === 0 ? "solo" : "group"
    }));
  }, [activeTab]);

  // Helper function to check if search data has changed
  const hasSearchDataChanged = (newSearchData: SearchData): boolean => {
    if (!lastSearchData) return true;

    return (
      newSearchData.destination !== lastSearchData.destination ||
      newSearchData.budget !== lastSearchData.budget ||
      newSearchData.startDate.getTime() !== lastSearchData.startDate.getTime() ||
      newSearchData.endDate.getTime() !== lastSearchData.endDate.getTime()
    );
  };

  const handleSearch = () => {
    const fullSearchData: SearchData = {
      ...searchData,
      travelMode: activeTab === 0 ? "solo" : "group"
    };
    
    if (!hasSearchDataChanged(fullSearchData)) {
      console.log("Search data unchanged, skipping search");
      return;
    }

    performSearch(fullSearchData);
  };

  const performSearch = async (fullSearchData: SearchData) => {
    setSearchLoading(true);
    setSearchError(null);
    setMatchedGroups([]);
    setCurrentGroupIndex(0);

    try {
      const userId = user?.id;

      if (activeTab === 0) {
        // SOLO TRAVEL MODE - Only search for solo travelers
        if (!userId) {
          throw new Error("Please sign in to search for solo travelers");
        }

        // Step 1: Store enhanced dynamic session (for solo matching)
        const sessionResponse = await fetch("/api/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            destinationName: fullSearchData.destination,
            budget: fullSearchData.budget,
            startDate: fullSearchData.startDate.toISOString().split("T")[0],
            endDate: fullSearchData.endDate.toISOString().split("T")[0],
            travelMode: fullSearchData.travelMode,
          }),
        });

        if (!sessionResponse.ok) {
          throw new Error("Failed to create session");
        }

        // Step 2: Get solo matches using enhanced matching
        const soloMatchesRes = await fetch(`/api/match-solo?userId=${userId}`);
        if (soloMatchesRes.ok) {
          const soloMatches = await soloMatchesRes.json();
          console.log("Solo matches found:", soloMatches.length);

          // Convert solo matches to group-like format for display
          const soloMatchesAsGroups = soloMatches.map((match: any, index: number) => ({
            id: `solo-${index}`,
            name: `${match.user.name || match.user.full_name || 'Traveler'} - ${match.destination}`,
            destination: match.destination,
            budget: match.user.budget || 'Not specified',
            start_date: fullSearchData.startDate,
            end_date: fullSearchData.endDate,
            compatibility_score: Math.round(match.score * 100),
            budget_difference: match.budgetDifference,
            user: {
              ...match.user,
              interests: Array.isArray(match.commonInterests) && match.commonInterests.length > 0
                ? match.commonInterests
                : match.user?.interests
            },
            is_solo_match: true
          }));
          
          setMatchedGroups(soloMatchesAsGroups);
          setCurrentGroupIndex(0);
          setLastSearchData(fullSearchData);
        } else {
          const errorData = await soloMatchesRes.json();
          throw new Error(errorData.message || "Failed to fetch solo matches");
        }
      } else {
        // GROUP TRAVEL MODE - Only search for groups
        const res = await fetch("/api/match-groups", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            destination: fullSearchData.destination,
            budget: fullSearchData.budget,
            startDate: fullSearchData.startDate,
            endDate: fullSearchData.endDate,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch groups");

        // Transform the API response to match GroupCard's expected format
        const transformedGroups = (data.groups || []).map((group: any) => ({
          id: group.id,
          name: group.name,
          privacy: "public" as const,
          destination: group.destination,
          dateRange: {
            start: group.startDate ? new Date(group.startDate) : new Date(),
            end: group.endDate ? new Date(group.endDate) : undefined,
            isOngoing: !group.endDate,
          },
          memberCount: group.members || 0,
          userStatus: null,
          creator: {
            name: group.creator?.name || "Unknown",
            username: group.creator?.username || "unknown",
            avatar: group.creator?.avatar || undefined,
          },
          cover_image: undefined,
        }));

        setMatchedGroups(transformedGroups);
        setCurrentGroupIndex(0);
        setLastSearchData(fullSearchData);
      }
    } catch (err: any) {
      setSearchError(err.message || "Unknown error");
      console.error("Search error:", err);
    } finally {
      setSearchLoading(false);
    }
  };

  // Reset search data when tab changes
  useEffect(() => {
    setLastSearchData(null);
    setMatchedGroups([]);
    setCurrentGroupIndex(0);
    setSearchError(null);
  }, [activeTab]);

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Conditional Match Card Component
  const MatchCardComponent = () => {
    if (activeTab === 0) {
      return (
        <SoloMatchCard
          key={matchedGroups[currentGroupIndex]?.id}
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
            onNextGroupAction();
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
      );
    } else {
      return (
        <GroupMatchCard
          key={matchedGroups[currentGroupIndex]?.id}
          group={matchedGroups[currentGroupIndex]}
          onJoinGroupAction={async (groupId) => {
            console.log("Joining group:", groupId);
            // TODO: Implement join group logic
          }}
          onRequestJoinAction={async (groupId) => {
            console.log("Requesting to join group:", groupId);
            // TODO: Implement request join logic
          }}
          onPassAction={async (groupId) => {
            console.log("Passing on group:", groupId);
            // TODO: Implement pass logic - move to next group
            onNextGroupAction();
          }}
          onViewGroupAction={(groupId) => {
            console.log("Viewing group:", groupId);
            // TODO: Navigate to group details
          }}
        />
      );
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Left Sidebar */}
      <div className="w-1/4 bg-background border-r border-gray-200 flex flex-col">
        {/* Component 1: Solo/Group Selection - Fixed at top */}
        <div className="p-4 bg-background flex-shrink-0">
          <div className="flex bg-background rounded-lg p-1 shadow-sm border border-gray-200">
            <button
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === 0
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
              onClick={() => handleTabChange(0)}
            >
              Solo Travel
            </button>
            <button
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === 1
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
              onClick={() => handleTabChange(1)}
            >
              Group Travel
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            {activeTab === 0 ? "Solo Travel Mode" : "Group Travel Mode"}
          </p>
        </div>

        {/* Component 2: Shared Filters with Scrollbar */}
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
              <div className="relative destination-dropdown-container">
                <Input
                  id="destination"
                  type="text"
                  value={searchData.destination}
                  onChange={(e) => setSearchData(prev => ({ ...prev, destination: e.target.value }))}
                  onFocus={() => setShowDestinationDropdown(true)}
                  placeholder="Where do you want to go?"
                  className="w-full"
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <button
                    onClick={() => {
                      if (searchData.destination.trim()) {
                        const searchQuery = encodeURIComponent(searchData.destination);
                        window.open(`https://www.google.com/maps/search/${searchQuery}`, '_blank');
                      }
                    }}
                    className="text-gray-400 hover:text-blue-600 transition-colors duration-200 p-1"
                    title="Search on Google Maps"
                  >
                    <MapPin className="w-4 h-4" />
                  </button>
                </div>
                {showDestinationDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    <div className="p-2">
                      <div className="text-xs font-medium text-gray-500 mb-2 px-2">
                        {searchData.destination.trim() ? 
                          `Destinations starting with "${searchData.destination}"` : 
                          "All Destinations (A-Z)"
                        }
                      </div>
                      {DESTINATION_OPTIONS
                        .filter(dest => {
                          const searchTerm = searchData.destination.toLowerCase().trim();
                          if (!searchTerm) return true;
                          
                          const startsWith = dest.toLowerCase().startsWith(searchTerm);
                          const contains = dest.toLowerCase().includes(searchTerm);
                          
                          if (searchTerm.length === 1) {
                            return startsWith;
                          }
                          
                          return startsWith || contains;
                        })
                        .sort((a, b) => {
                          const searchTerm = searchData.destination.toLowerCase().trim();
                          if (!searchTerm) return a.localeCompare(b);
                          
                          const aStartsWith = a.toLowerCase().startsWith(searchTerm);
                          const bStartsWith = b.toLowerCase().startsWith(searchTerm);
                          
                          if (aStartsWith && !bStartsWith) return -1;
                          if (!aStartsWith && bStartsWith) return 1;
                          
                          return a.localeCompare(b);
                        })
                        .slice(0, 20)
                        .map((destination) => (
                          <div
                            key={destination}
                            className="px-3 py-2 hover:bg-blue-50 cursor-pointer rounded-md text-sm flex items-center justify-between group"
                            onClick={() => {
                              setSearchData(prev => ({ ...prev, destination }));
                              setShowDestinationDropdown(false);
                            }}
                          >
                            <span>{destination}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const searchQuery = encodeURIComponent(destination);
                                window.open(`https://www.google.com/maps/search/${searchQuery}`, '_blank');
                              }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-blue-600 hover:text-blue-800 text-xs px-2 py-1 rounded hover:bg-blue-100"
                              title="Open in Google Maps"
                            >
                              <MapPin className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      
                      {/* Custom Search Option */}
                      {searchData.destination.trim() && !DESTINATION_OPTIONS.some(dest => 
                        dest.toLowerCase().includes(searchData.destination.toLowerCase())
                      ) && (
                        <div className="border-t border-gray-200 mt-2 pt-2">
                          <div className="px-3 py-2 text-sm text-gray-600">
                            <div className="flex items-center justify-between">
                              <span>Search "{searchData.destination}" on Google Maps</span>
                              <button
                                onClick={() => {
                                  const searchQuery = encodeURIComponent(searchData.destination);
                                  window.open(`https://www.google.com/maps/search/${searchQuery}`, '_blank');
                                  setShowDestinationDropdown(false);
                                }}
                                className="text-blue-600 hover:text-blue-800 text-xs px-3 py-1 rounded bg-blue-50 hover:bg-blue-100 transition-colors duration-200"
                              >
                                Search Maps
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
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

      {/* Right Content Area */}
      <div className="flex-1 bg-background overflow-hidden">
        {/* Loading Overlay */}
        {(isPageLoading || searchLoading) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-card h-screen">
            <Spinner variant="spinner" size="md" color="primary" />
          </div>
        )}

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
                  onClick={handlePreviousGroup}
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
                  onClick={handleNextGroup}
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
            
            {/* Conditional Match Card */}
            <MatchCardComponent />
            
            {/* Match counter */}
            {matchedGroups.length > 1 && (
              <div className="flex items-center gap-2 mt-6 text-sm text-gray-600">
                <span className="font-medium">{currentGroupIndex + 1}</span>
                <span>of</span>
                <span className="font-medium">{matchedGroups.length}</span>
                <span>{activeTab === 0 ? "travelers" : "groups"}</span>
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
                  Try adjusting your search criteria or dates to find more {activeTab === 0 ? "travel companions" : "travel groups"}.
                </p>
                <div className="bg-background rounded-lg p-4 text-sm text-gray-600">
                  <p><strong>Destination:</strong> {lastSearchData.destination}</p>
                  <p><strong>Budget:</strong> ₹{lastSearchData.budget.toLocaleString()}</p>
                  <p><strong>Dates:</strong> {lastSearchData.startDate.toLocaleDateString()} - {lastSearchData.endDate.toLocaleDateString()}</p>
                  <p><strong>Mode:</strong> {activeTab === 0 ? "Solo Travel" : "Group Travel"}</p>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-24 h-24 bg-background rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-12 h-12 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Start your search</h3>
                <p className="text-gray-600 max-w-md">
                  Enter your travel details in the sidebar to find compatible {activeTab === 0 ? "travel companions" : "travel groups"}.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
