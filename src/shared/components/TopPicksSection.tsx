"use client";

import React, { useState } from "react";
import DestinationCard from "./DestinationCard";
import { Button } from "@/shared/components/ui/button";
import { ArrowRight } from "lucide-react";

interface Destination {
  id: string;
  title: string;
  image: string;
  location: string;
  description?: string;
}

interface TopPicksSectionProps {
  destinations: Destination[];
  className?: string;
}

export default function TopPicksSection({ 
  destinations, 
  className = "" 
}: TopPicksSectionProps) {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const handleFavoriteToggle = (id: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(id)) {
        newFavorites.delete(id);
      } else {
        newFavorites.add(id);
      }
      return newFavorites;
    });
  };

  return (
    <section className={`py-20 px-4 bg-gradient-to-b from-gray-50 to-white ${className}`}>
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Our top picks{" "}
            <span className="text-blue-600 relative">
              destinations
              <svg
                className="absolute -bottom-3 left-0 w-full h-4"
                viewBox="0 0 200 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M2 10C15 4 25 12 40 8C55 4 65 10 80 6C95 2 105 8 120 4C135 0 145 6 160 4C175 2 185 6 198 4"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  className="text-blue-600"
                />
              </svg>
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Discover the most loved destinations and experiences curated by our community
          </p>
        </div>

        {/* Destination Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {destinations.map((destination) => (
            <DestinationCard
              key={destination.id}
              {...destination}
              isFavorite={favorites.has(destination.id)}
              onFavoriteToggle={handleFavoriteToggle}
            />
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center">
          <Button
            onClick={() => window.location.href = `/explore`}
            size="lg"
            className="inline-flex items-center px-10 py-4 text-lg font-semibold rounded-full bg-blue-600 hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
          >
            View All Destinations
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </div>
    </section>
  );
}
