"use client";

import { Badge } from "@/shared/components/ui/badge";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Switch } from "@/shared/components/ui/switch";
import { Slider } from "@heroui/react";
import { Filter } from "lucide-react";

import { Filters } from "../types";

interface FiltersPanelProps {
  filters: Filters;
  onFilterChange: (key: string, value: any) => void;
}

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

const TRAVEL_STYLE_OPTIONS = [
  "Any",
  "Budget",
  "Mid-range",
  "Luxury",
  "Backpacker",
];

const GENDER_OPTIONS = ["Any", "Male", "Female", "Other"];
const PERSONALITY_OPTIONS = ["Any", "Extrovert", "Introvert", "Ambivert"];
const NATIONALITY_OPTIONS = [
  "Any",
  "Indian",
  "American",
  "British",
  "Canadian",
  "Australian",
  "German",
  "French",
  "Japanese",
  "Chinese",
  "Korean",
  "Singaporean",
  "Thai",
  "Vietnamese",
  "Indonesian",
  "Malaysian",
  "Filipino",
  "Other",
];
const LANGUAGE_OPTIONS = [
  "Any",
  "English",
  "Hindi",
  "Spanish",
  "French",
  "German",
  "Italian",
  "Portuguese",
  "Russian",
  "Chinese",
  "Japanese",
  "Korean",
  "Arabic",
  "Thai",
  "Vietnamese",
  "Indonesian",
  "Malay",
  "Tagalog",
  "Other",
];

export const FiltersPanel = ({
  filters,
  onFilterChange,
}: FiltersPanelProps) => {
  return (
    <div className="pt-6 space-y-6">
      <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
        <Filter className="w-5 h-5" />
        Additional Filters
      </h3>

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
          onChange={(value) =>
            onFilterChange(
              "ageRange",
              Array.isArray(value) ? value : [value, value]
            )
          }
          className="w-full"
          color="primary"
        />
      </div>

      {/* 2. Gender */}
      <div className="space-y-2">
        <Label htmlFor="gender" className="text-base font-medium text-gray-900">
          Gender Preference
        </Label>
        <Select
          value={filters.gender}
          onValueChange={(value) => onFilterChange("gender", value)}
        >
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
        <Label
          htmlFor="personality"
          className="text-base font-medium text-gray-900"
        >
          Personality
        </Label>
        <Select
          value={filters.personality}
          onValueChange={(value) => onFilterChange("personality", value)}
        >
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
              variant={
                filters.interests.includes(interest) ? "default" : "outline"
              }
              className="cursor-pointer hover:bg-blue-50 rounded-full px-3 py-1 transition-all duration-200 hover:scale-105"
              onClick={() => {
                const newInterests = filters.interests.includes(interest)
                  ? filters.interests.filter((i) => i !== interest)
                  : [...filters.interests, interest];
                onFilterChange("interests", newInterests);
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
              variant={
                filters.languages.includes(language) ? "default" : "outline"
              }
              className="cursor-pointer hover:bg-blue-50 rounded-full px-3 py-1 transition-all duration-200 hover:scale-105"
              onClick={() => {
                const newLanguages = filters.languages.includes(language)
                  ? filters.languages.filter((l) => l !== language)
                  : [...filters.languages, language];
                onFilterChange("languages", newLanguages);
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
          <Label
            htmlFor="smoking"
            className="text-base font-medium text-gray-900"
          >
            Smoking
          </Label>
          <p className="text-sm text-gray-600">
            {filters.smoking === "Yes"
              ? "Comfortable with smokers"
              : "Non-smoking preferred"}
          </p>
        </div>
        <Switch
          id="smoking"
          checked={filters.smoking === "Yes"}
          onCheckedChange={(checked) =>
            onFilterChange("smoking", checked ? "Yes" : "No")
          }
          className="data-[state=checked]:bg-blue-600"
        />
      </div>

      {/* 7. Drinking */}
      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50/50">
        <div className="space-y-1">
          <Label
            htmlFor="drinking"
            className="text-base font-medium text-gray-900"
          >
            Drinking
          </Label>
          <p className="text-sm text-gray-600">
            {filters.drinking === "Yes"
              ? "Comfortable with drinkers"
              : "Non-drinking preferred"}
          </p>
        </div>
        <Switch
          id="drinking"
          checked={filters.drinking === "Yes"}
          onCheckedChange={(checked) =>
            onFilterChange("drinking", checked ? "Yes" : "No")
          }
          className="data-[state=checked]:bg-blue-600"
        />
      </div>

      {/* 8. Nationality */}
      <div className="space-y-2">
        <Label
          htmlFor="nationality"
          className="text-base font-medium text-gray-900"
        >
          Nationality
        </Label>
        <Select
          value={filters.nationality}
          onValueChange={(value) => onFilterChange("nationality", value)}
        >
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
  );
};
