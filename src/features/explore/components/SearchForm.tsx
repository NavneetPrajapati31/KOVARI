"use client";

import { useState, useEffect } from "react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Slider } from "@heroui/react";
import { CalendarDays, MapPin } from "lucide-react";

import { SearchData } from "../types";

interface SearchFormProps {
  searchData: SearchData;
  onSearchDataChange: (data: SearchData) => void;
  onSearch: () => void;
  isLoading: boolean;
}

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

export const SearchForm = ({ searchData, onSearchDataChange, onSearch, isLoading }: SearchFormProps) => {
  const [showDestinationDropdown, setShowDestinationDropdown] = useState(false);

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

  const handleSearchDataChange = (updates: Partial<SearchData>) => {
    onSearchDataChange({ ...searchData, ...updates });
  };

  return (
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
            onChange={(e) => handleSearchDataChange({ destination: e.target.value })}
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
                        handleSearchDataChange({ destination });
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
              onChange={(e) => handleSearchDataChange({ startDate: new Date(e.target.value) })}
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
              onChange={(e) => handleSearchDataChange({ endDate: new Date(e.target.value) })}
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
            onChange={(value) => handleSearchDataChange({ budget: Array.isArray(value) ? value[0] : value })}
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
              onClick={() => handleSearchDataChange({ budget })}
              className="text-xs"
            >
              {budget === 50000 ? "Luxury ₹50k+" : `₹${budget.toLocaleString()}`}
            </Button>
          ))}
        </div>
      </div>

      {/* Search Button */}
      <Button
        onClick={onSearch}
        disabled={isLoading || !searchData.destination}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
      >
        {isLoading ? "Searching..." : "SEARCH"}
      </Button>
    </div>
  );
};
