"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/shared/components/ui/input";
import { Loader2 } from "lucide-react";

interface LocationInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const LocationInput: React.FC<LocationInputProps> = ({
  value,
  onChange,
  placeholder = "Search your location",
  className,
}) => {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const controller = new AbortController();
    const trimmedQuery = query.trim();

    if (!trimmedQuery || suggestions.includes(trimmedQuery)) {
      setSuggestions([]);
      return () => controller.abort();
    }

    const timeout = setTimeout(async () => {
      setIsLoading(true);
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          trimmedQuery
        )}&format=json&addressdetails=1&limit=5`;
        const res = await fetch(url, {
          signal: controller.signal,
          headers: {
            Accept: "application/json",
            "Accept-Language": "en",
            "User-Agent": "Kovari/1.0 (profile-edit@kovari.app)",
          },
        });
        if (!res.ok) return;
        const data = await res.json();
        const results = data.map((item: any) => item.display_name);
        setSuggestions(results);
        setShowSuggestions(true);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("Location search error:", error);
        }
      } finally {
        setIsLoading(false);
      }
    }, 500);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  const handleSelect = (suggestion: string) => {
    setQuery(suggestion);
    onChange(suggestion);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
          }}
          onFocus={() => query.trim() && setShowSuggestions(true)}
          placeholder={placeholder}
          className={className}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border bg-popover shadow-lg max-h-56 overflow-auto">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              className="w-full px-3 py-2 text-left text-sm text-muted-foreground hover:bg-gray-100"
              onClick={() => handleSelect(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
