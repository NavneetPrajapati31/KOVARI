"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { MapPin, Search, Loader2, Database, Edit3 } from "lucide-react";

// Dummy database data
const dummyLocationData = {
  id: 1,
  name: "Eiffel Tower, Paris",
  description: "Saved destination",
  coordinates: "48.8584,2.2945",
  savedAt: "2024-01-15",
};

export default function Component() {
  const [location, setLocation] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [savedLocation, setSavedLocation] = useState<
    typeof dummyLocationData | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Simulate loading saved location from database
  useEffect(() => {
    const loadSavedLocation = () => {
      // Simulate API call delay
      setTimeout(() => {
        setSavedLocation(dummyLocationData);
        setSelectedLocation(dummyLocationData.name);
      }, 500);
    };

    loadSavedLocation();
  }, []);

  const handleViewLocation = async () => {
    if (!location.trim()) return;

    setIsLoading(true);
    setTimeout(() => {
      setSelectedLocation(location.trim());
      setIsLoading(false);
      setIsEditing(false);
    }, 800);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleViewLocation();
    }
  };

  const handleEditLocation = () => {
    setIsEditing(true);
    setLocation("");
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setLocation("");
    if (savedLocation) {
      setSelectedLocation(savedLocation.name);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto space-y-4">
      {/* Header */}

      {/* Current/Saved Location Display */}
      {savedLocation && !isEditing && (
        <Card className="border-border bg-card gap-1 py-2">
          <CardHeader className="gap-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-primary">
                Destination
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEditLocation}
                className="h-6 w-6 p-0 text-primary hover:bg-transparent hover:text-primary"
              >
                <Edit3 className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm font-semibold text-primary">
              {savedLocation.name}
            </p>
          </CardContent>
          {/* Maps Display */}
          {selectedLocation && (
            <Card className="overflow-hidden shadow-none p-3 bg-card border-none">
              <CardContent className="p-0">
                <div className="relative w-full h-52">
                  <iframe
                    src={`https://www.google.com/maps?q=${encodeURIComponent(
                      selectedLocation
                    )}&output=embed`}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title={`Map of ${selectedLocation}`}
                    className="rounded-lg"
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </Card>
      )}

      {/* Search Card - Only show when editing or no saved location */}
      {(isEditing || !savedLocation) && (
        <Card className="shadow-sm border-border">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Search className="h-4 w-4" />
              {isEditing ? "Change Location" : "Search Location"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Enter new location..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onKeyPress={handleKeyPress}
              className="text-sm"
              disabled={isLoading}
            />
            <div className="flex gap-2">
              <Button
                onClick={handleViewLocation}
                disabled={!location.trim() || isLoading}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                size="sm"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <MapPin className="h-3 w-3 mr-2" />
                    View
                  </>
                )}
              </Button>
              {isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelEdit}
                  className="px-3"
                >
                  Cancel
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State for Initial Load */}
      {!savedLocation && !selectedLocation && (
        <Card className="bg-gray-50">
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center space-y-2">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
              <p className="text-sm text-gray-500">
                Loading saved destination...
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
