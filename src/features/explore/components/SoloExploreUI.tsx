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

  const [showDestinationDropdown, setShowDestinationDropdown] = useState(false);

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

  const DESTINATION_OPTIONS = [
    // Popular Indian Cities
    "Mumbai, Maharashtra", "Delhi, India", "Bangalore, Karnataka", "Chennai, Tamil Nadu", "Kolkata, West Bengal",
    "Hyderabad, Telangana", "Pune, Maharashtra", "Ahmedabad, Gujarat", "Jaipur, Rajasthan", "Lucknow, Uttar Pradesh",
    
    // Popular International Cities
    "Tokyo, Japan", "Bangkok, Thailand", "Singapore", "Seoul, South Korea", "Hong Kong", "Bali, Indonesia",
    "Paris, France", "London, UK", "Rome, Italy", "Barcelona, Spain", "New York City, USA", "Los Angeles, USA",
    
    // Underrated Indian Hill Stations & Offbeat Places
    "Spiti Valley, Himachal Pradesh", "Saputara, Gujarat", "Matheran, Maharashtra", "Lonavala, Maharashtra", "Khandala, Maharashtra",
    "Mahabaleshwar, Maharashtra", "Panchgani, Maharashtra", "Bhandardara, Maharashtra", "Igatpuri, Maharashtra", "Amboli, Maharashtra",
    "Chikhaldara, Maharashtra", "Toranmal, Maharashtra", "Panhala, Maharashtra", "Rajgad, Maharashtra", "Sinhagad, Maharashtra",
    "Lavasa, Maharashtra", "Tamhini Ghat, Maharashtra", "Karnala, Maharashtra", "Tungareshwar, Maharashtra", "Bhimashankar, Maharashtra",
    "Malshej Ghat, Maharashtra", "Harishchandragad, Maharashtra", "Ratangad, Maharashtra", "Kalsubai, Maharashtra", "Sandhan Valley, Maharashtra",
    
    // Himachal Pradesh Offbeat
    "Kalpa, Himachal Pradesh", "Chitkul, Himachal Pradesh", "Tabo, Himachal Pradesh", "Dhankar, Himachal Pradesh",
    "Kaza, Himachal Pradesh", "Keylong, Himachal Pradesh", "Udaipur, Himachal Pradesh", "Tirthan Valley, Himachal Pradesh",
    "Jibhi, Himachal Pradesh", "Shoja, Himachal Pradesh", "Kullu Valley, Himachal Pradesh", "Manikaran, Himachal Pradesh",
    "Kasol, Himachal Pradesh", "Malana, Himachal Pradesh", "Tosh, Himachal Pradesh", "Pulga, Himachal Pradesh",
    "Grahan, Himachal Pradesh", "Kheerganga, Himachal Pradesh", "Pin Parvati Pass, Himachal Pradesh", "Hamta Pass, Himachal Pradesh",
    
    // Uttarakhand Offbeat
    "Chopta, Uttarakhand", "Tungnath, Uttarakhand", "Chandrashila, Uttarakhand", "Deoria Tal, Uttarakhand",
    "Kedarkantha, Uttarakhand", "Har Ki Dun, Uttarakhand", "Valley of Flowers, Uttarakhand", "Hemkund Sahib, Uttarakhand",
    "Auli, Uttarakhand", "Munsiyari, Uttarakhand", "Pithoragarh, Uttarakhand", "Binsar, Uttarakhand",
    "Ranikhet, Uttarakhand", "Almora, Uttarakhand", "Kausani, Uttarakhand", "Bageshwar, Uttarakhand",
    "Gangotri, Uttarakhand", "Yamunotri, Uttarakhand", "Badrinath, Uttarakhand", "Kedarnath, Uttarakhand",
    
    // Rajasthan Offbeat
    "Bundi, Rajasthan", "Mandawa, Rajasthan", "Bikaner, Rajasthan", "Jaisalmer, Rajasthan", "Jodhpur, Rajasthan",
    "Udaipur, Rajasthan", "Pushkar, Rajasthan", "Mount Abu, Rajasthan", "Chittorgarh, Rajasthan", "Ranthambore, Rajasthan",
    "Sawai Madhopur, Rajasthan", "Alwar, Rajasthan", "Bharatpur, Rajasthan", "Kota, Rajasthan", "Ajmer, Rajasthan",
    "Sikar, Rajasthan", "Jhunjhunu, Rajasthan", "Churu, Rajasthan", "Nagaur, Rajasthan", "Pali, Rajasthan",
    
    // Gujarat Offbeat
    "Girnar, Gujarat", "Palitana, Gujarat", "Dwarka, Gujarat", "Somnath, Gujarat", "Rann of Kutch, Gujarat",
    "Bhuj, Gujarat", "Mandvi, Gujarat", "Vadodara, Gujarat", "Surat, Gujarat",
    "Valsad, Gujarat", "Vapi, Gujarat", "Silvassa, Dadra & Nagar Haveli", "Daman, Daman & Diu", "Diu, Daman & Diu",
    
    // Karnataka Offbeat
    "Coorg, Karnataka", "Chikmagalur, Karnataka", "Sakleshpur, Karnataka", "Kodagu, Karnataka", "Mysore, Karnataka",
    "Hampi, Karnataka", "Badami, Karnataka", "Pattadakal, Karnataka", "Aihole, Karnataka", "Bijapur, Karnataka",
    "Bidar, Karnataka", "Gulbarga, Karnataka", "Raichur, Karnataka", "Bellary, Karnataka", "Hospet, Karnataka",
    
    // Tamil Nadu Offbeat
    "Ooty, Tamil Nadu", "Kodaikanal, Tamil Nadu", "Yercaud, Tamil Nadu", "Coonoor, Tamil Nadu", "Kotagiri, Tamil Nadu",
    "Valparai, Tamil Nadu", "Topslip, Tamil Nadu", "Pollachi, Tamil Nadu", "Dindigul, Tamil Nadu", "Madurai, Tamil Nadu",
    "Thanjavur, Tamil Nadu", "Tiruchirappalli, Tamil Nadu", "Salem, Tamil Nadu", "Erode, Tamil Nadu", "Coimbatore, Tamil Nadu",
    
    // Kerala Offbeat
    "Munnar, Kerala", "Thekkady, Kerala", "Wayanad, Kerala", "Varkala, Kerala", "Kovalam, Kerala",
    "Alleppey, Kerala", "Kumarakom, Kerala", "Fort Kochi, Kerala", "Bekal, Kerala", "Kannur, Kerala",
    "Calicut, Kerala", "Palakkad, Kerala", "Thrissur, Kerala", "Kottayam, Kerala", "Pathanamthitta, Kerala",
    
    // Goa Offbeat
    "Anjuna, Goa", "Vagator, Goa", "Chapora, Goa", "Arambol, Goa", "Morjim, Goa",
    "Ashwem, Goa", "Mandrem, Goa", "Palolem, Goa", "Agonda, Goa", "Cola, Goa",
    "Galjibag, Goa", "Tilari, Goa", "Keri, Goa", "Terekhol, Goa", "Querim, Goa",
    
    // North East India
    "Gangtok, Sikkim", "Lachung, Sikkim", "Lachen, Sikkim", "Pelling, Sikkim", "Ravangla, Sikkim",
    "Darjeeling, West Bengal", "Kalimpong, West Bengal", "Kurseong, West Bengal", "Mirik, West Bengal", "Siliguri, West Bengal",
    "Shillong, Meghalaya", "Cherrapunji, Meghalaya", "Mawsynram, Meghalaya", "Dawki, Meghalaya", "Nongpoh, Meghalaya",
    "Guwahati, Assam", "Kaziranga, Assam", "Majuli, Assam", "Jorhat, Assam", "Tezpur, Assam",
    "Imphal, Manipur", "Ukhrul, Manipur", "Senapati, Manipur", "Tamenglong, Manipur", "Churachandpur, Manipur",
    "Aizawl, Mizoram", "Lunglei, Mizoram", "Champhai, Mizoram", "Serchhip, Mizoram", "Kolasib, Mizoram",
    "Kohima, Nagaland", "Dimapur, Nagaland", "Mokokchung, Nagaland", "Tuensang, Nagaland", "Wokha, Nagaland",
    "Agartala, Tripura", "Udaipur, Tripura", "Ambassa, Tripura", "Kailasahar, Tripura", "Dharmanagar, Tripura",
    "Itanagar, Arunachal Pradesh", "Tawang, Arunachal Pradesh", "Bomdila, Arunachal Pradesh", "Ziro, Arunachal Pradesh", "Pasighat, Arunachal Pradesh",
    
    // Central India
    "Bhopal, Madhya Pradesh", "Indore, Madhya Pradesh", "Gwalior, Madhya Pradesh", "Khajuraho, Madhya Pradesh", "Orchha, Madhya Pradesh",
    "Mandu, Madhya Pradesh", "Sanchi, Madhya Pradesh", "Ujjain, Madhya Pradesh", "Omkareshwar, Madhya Pradesh", "Maheshwar, Madhya Pradesh",
    "Chitrakoot, Madhya Pradesh", "Pachmarhi, Madhya Pradesh", "Amarkantak, Madhya Pradesh", "Bandhavgarh, Madhya Pradesh", "Kanha, Madhya Pradesh",
    "Pench, Madhya Pradesh", "Satpura, Madhya Pradesh", "Panna, Madhya Pradesh", "Madhav, Madhya Pradesh", "Van Vihar, Madhya Pradesh",
    
    // International Offbeat Destinations
    "Luang Prabang, Laos", "Vientiane, Laos", "Vang Vieng, Laos", "Pakse, Laos", "Champasak, Laos",
    "Siem Reap, Cambodia", "Phnom Penh, Cambodia", "Battambang, Cambodia", "Kampot, Cambodia", "Kep, Cambodia",
    "Yangon, Myanmar", "Bagan, Myanmar", "Mandalay, Myanmar", "Inle Lake, Myanmar", "Kalaw, Myanmar",
    "Chiang Rai, Thailand", "Pai, Thailand", "Mae Hong Son, Thailand", "Kanchanaburi, Thailand", "Ayutthaya, Thailand",
    "Hoi An, Vietnam", "Hue, Vietnam", "Sapa, Vietnam", "Mai Chau, Vietnam", "Ninh Binh, Vietnam",
    "Yogyakarta, Indonesia", "Bandung, Indonesia", "Malang, Indonesia", "Surabaya, Indonesia", "Medan, Indonesia",
    "Ipoh, Malaysia", "Malacca, Malaysia", "Langkawi, Malaysia", "Penang, Malaysia", "Kuching, Malaysia",
    "Baguio, Philippines", "Vigan, Philippines", "Sagada, Philippines", "Banaue, Philippines", "Puerto Princesa, Philippines",
    "Gyeongju, South Korea", "Busan, South Korea", "Jeju Island, South Korea", "Andong, South Korea", "Sokcho, South Korea",
    "Takayama, Japan", "Kanazawa, Japan", "Nara, Japan", "Hiroshima, Japan", "Fukuoka, Japan",
    "Tainan, Taiwan", "Taichung, Taiwan", "Hualien, Taiwan", "Taitung, Taiwan", "Pingtung, Taiwan",
    
    // European Offbeat
    "Porto, Portugal", "Sintra, Portugal", "Coimbra, Portugal", "Evora, Portugal", "Faro, Portugal",
    "Seville, Spain", "Granada, Spain", "Valencia, Spain", "Bilbao, Spain", "Santiago de Compostela, Spain",
    "Lyon, France", "Marseille, France", "Nice, France", "Strasbourg, France", "Bordeaux, France",
    "Florence, Italy", "Venice, Italy", "Milan, Italy", "Naples, Italy", "Palermo, Italy",
    "Salzburg, Austria", "Innsbruck, Austria", "Graz, Austria", "Linz, Austria", "Klagenfurt, Austria",
    "Munich, Germany", "Hamburg, Germany", "Cologne, Germany", "Dresden, Germany", "Leipzig, Germany",
    "Edinburgh, UK", "Manchester, UK", "Liverpool, UK", "Birmingham, UK", "Newcastle, UK",
    "Dublin, Ireland", "Cork, Ireland", "Galway, Ireland", "Limerick, Ireland", "Waterford, Ireland",
    "Reykjavik, Iceland", "Akureyri, Iceland", "Husavik, Iceland", "Egilsstadir, Iceland", "Hofn, Iceland",
    "Oslo, Norway", "Bergen, Norway", "Trondheim, Norway", "Tromso, Norway", "Stavanger, Norway",
    "Stockholm, Sweden", "Gothenburg, Sweden", "Malmo, Sweden", "Uppsala, Sweden", "Vasteras, Sweden",
    "Helsinki, Finland", "Tampere, Finland", "Turku, Finland", "Oulu, Finland", "Rovaniemi, Finland",
    "Copenhagen, Denmark", "Aarhus, Denmark", "Odense, Denmark", "Aalborg, Denmark", "Esbjerg, Denmark",
    "Amsterdam, Netherlands", "Rotterdam, Netherlands", "The Hague, Netherlands", "Utrecht, Netherlands", "Eindhoven, Netherlands",
    "Brussels, Belgium", "Antwerp, Belgium", "Ghent, Belgium", "Bruges, Belgium", "Liege, Belgium",
    "Zurich, Switzerland", "Geneva, Switzerland", "Bern, Switzerland", "Basel, Switzerland", "Lucerne, Switzerland",
    "Vienna, Austria", "Innsbruck, Austria", "Graz, Austria", "Linz, Austria",
    
    // Americas Offbeat
    "Quebec City, Canada", "Montreal, Canada", "Vancouver, Canada", "Toronto, Canada", "Calgary, Canada",
    "Edmonton, Canada", "Winnipeg, Canada", "Halifax, Canada", "St. John's, Canada", "Victoria, Canada",
    "Mexico City, Mexico", "Guadalajara, Mexico", "Monterrey, Mexico", "Puebla, Mexico", "Oaxaca, Mexico",
    "Merida, Mexico", "San Miguel de Allende, Mexico", "Guanajuato, Mexico", "Queretaro, Mexico", "Morelia, Mexico",
    "Buenos Aires, Argentina", "Cordoba, Argentina", "Rosario, Argentina", "Mendoza, Argentina", "Salta, Argentina",
    "Rio de Janeiro, Brazil", "Sao Paulo, Brazil", "Brasilia, Brazil", "Salvador, Brazil", "Recife, Brazil",
    "Lima, Peru", "Cusco, Peru", "Arequipa, Peru", "Trujillo, Peru", "Chiclayo, Peru",
    "Santiago, Chile", "Valparaiso, Chile", "La Serena, Chile", "Antofagasta, Chile", "Iquique, Chile",
    "Bogota, Colombia", "Medellin, Colombia", "Cali, Colombia", "Cartagena, Colombia", "Santa Marta, Colombia",
    
    // Africa Offbeat
    "Cape Town, South Africa", "Johannesburg, South Africa", "Durban, South Africa", "Port Elizabeth, South Africa", "Bloemfontein, South Africa",
    "Marrakech, Morocco", "Fez, Morocco", "Casablanca, Morocco", "Tangier, Morocco", "Agadir, Morocco",
    "Cairo, Egypt", "Alexandria, Egypt", "Luxor, Egypt", "Aswan, Egypt", "Hurghada, Egypt",
    "Nairobi, Kenya", "Mombasa, Kenya", "Kisumu, Kenya", "Nakuru, Kenya", "Eldoret, Kenya",
    "Dar es Salaam, Tanzania", "Arusha, Tanzania", "Zanzibar, Tanzania", "Mwanza, Tanzania", "Mbeya, Tanzania",
    "Kampala, Uganda", "Entebbe, Uganda", "Jinja, Uganda", "Mbarara, Uganda", "Gulu, Uganda",
    "Kigali, Rwanda", "Butare, Rwanda", "Gisenyi, Rwanda", "Ruhengeri, Rwanda", "Kibuye, Rwanda",
    "Addis Ababa, Ethiopia", "Dire Dawa, Ethiopia", "Gondar, Ethiopia", "Bahir Dar, Ethiopia", "Lalibela, Ethiopia",
    
    // Oceania Offbeat
    "Sydney, Australia", "Melbourne, Australia", "Brisbane, Australia", "Perth, Australia", "Adelaide, Australia",
    "Gold Coast, Australia", "Cairns, Australia", "Darwin, Australia", "Hobart, Australia", "Canberra, Australia",
    "Auckland, New Zealand", "Wellington, New Zealand", "Christchurch, New Zealand", "Hamilton, New Zealand", "Tauranga, New Zealand",
    "Rotorua, New Zealand", "Queenstown, New Zealand", "Dunedin, New Zealand", "Napier, New Zealand", "Palmerston North, New Zealand",
    "Fiji Islands", "Bora Bora, French Polynesia", "Tahiti, French Polynesia", "Moore, French Polynesia", "Huahine, French Polynesia",
    "Raiatea, French Polynesia", "Taha'a, French Polynesia", "Maupiti, French Polynesia", "Tikehau, French Polynesia", "Fakarava, French Polynesia",
    
    // Middle East Offbeat
    "Dubai, UAE", "Abu Dhabi, UAE", "Sharjah, UAE", "Ajman, UAE", "Ras Al Khaimah, UAE",
    "Doha, Qatar", "Al Wakrah, Qatar", "Al Khor, Qatar", "Al Rayyan, Qatar", "Umm Salal, Qatar",
    "Kuwait City, Kuwait", "Salmiya, Kuwait", "Hawalli, Kuwait", "Jahra, Kuwait", "Fahaheel, Kuwait",
    "Manama, Bahrain", "Muharraq, Bahrain", "Riffa, Bahrain", "Hamad Town, Bahrain", "Isa Town, Bahrain",
    "Muscat, Oman", "Salalah, Oman", "Nizwa, Oman", "Sohar, Oman", "Sur, Oman",
    "Sanaa, Yemen", "Aden, Yemen", "Taiz, Yemen", "Hodeidah, Yemen", "Ibb, Yemen",
    "Amman, Jordan", "Zarqa, Jordan", "Irbid, Jordan", "Al Salt, Jordan", "Madaba, Jordan",
    "Petra, Jordan", "Wadi Rum, Jordan", "Aqaba, Jordan", "Jerash, Jordan", "Ajloun, Jordan",
    "Jerusalem, Israel", "Tel Aviv, Israel", "Haifa, Israel", "Beer Sheva, Israel", "Eilat, Israel",
    "Nazareth, Israel", "Tiberias, Israel", "Safed, Israel", "Acre, Israel", "Bethlehem, Palestine",
    "Beirut, Lebanon", "Tripoli, Lebanon", "Sidon, Lebanon", "Tyre, Lebanon", "Baalbek, Lebanon",
    "Damascus, Syria", "Aleppo, Syria", "Homs, Syria", "Hama, Syria", "Latakia, Syria",
    
    // Popular Islands & Coastal Destinations
    "Maldives", "Seychelles", "Mauritius", "Madagascar", "Comoros", "Reunion Island", "Mayotte, France",
    "Hawaii, USA", "Puerto Rico, USA", "Jamaica", "Bahamas", "Cayman Islands", "Aruba", "Curacao",
    "St. Lucia", "Antigua and Barbuda", "Barbados", "Grenada", "Trinidad and Tobago", "St. Kitts and Nevis",
    "St. Vincent and the Grenadines", "Dominica", "St. Maarten", "Anguilla", "British Virgin Islands",
    "US Virgin Islands", "Turks and Caicos", "Bermuda", "Cape Verde", "Sao Tome and Principe",
    
    // Adventure & Trekking Destinations
    "Nepal", "Bhutan", "Tibet, China", "Mongolia", "Kazakhstan", "Uzbekistan", "Kyrgyzstan",
    "Tajikistan", "Turkmenistan", "Azerbaijan", "Georgia", "Armenia", "Moldova", "Belarus",
    "Ukraine", "Romania", "Bulgaria", "Serbia", "North Macedonia", "Albania", "Kosovo",
    "Montenegro", "Bosnia and Herzegovina", "Slovenia", "Croatia", "Hungary", "Slovakia",
    "Czech Republic", "Poland", "Lithuania", "Latvia", "Estonia", "Finland", "Sweden",
    "Norway", "Denmark", "Iceland", "Ireland", "UK", "Netherlands", "Belgium", "Luxembourg",
    "Switzerland", "Austria", "Germany", "France", "Spain", "Portugal", "Italy", "Greece",
    "Turkey", "Cyprus", "Malta", "Croatia", "Slovenia", "Hungary", "Slovakia", "Czech Republic"
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
                      <div className="text-xs font-medium text-gray-500 mb-2 px-2">Popular Destinations</div>
                      {DESTINATION_OPTIONS.filter(dest => 
                        dest.toLowerCase().includes(searchData.destination.toLowerCase())
                      ).map((destination) => (
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
