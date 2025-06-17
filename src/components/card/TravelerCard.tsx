"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Calendar, User } from "lucide-react"
import Image from "next/image"

interface TravelerCardProps {
  traveler: {
    id: string
    name: string
    age: number
    destination: string
    travelDates: string
    bio: string
    profilePhoto: string
    matchStrength: "high" | "medium" | "low"
  }
  onConnect?: (travelerId: string) => void
  onViewProfile?: (travelerId: string) => void
}

export default function TravelerCard({ traveler, onConnect, onViewProfile }: TravelerCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  const getMatchBadgeColor = (strength: string) => {
    switch (strength) {
      case "high":
        return "bg-emerald-500 border-white shadow-sm"
      case "medium":
        return "bg-amber-500 border-white shadow-sm"
      case "low":
        return "bg-red-500 border-white shadow-sm"
      default:
        return "bg-gray-400 border-white shadow-sm"
    }
  }

  const getMatchBadgeText = (strength: string) => {
    switch (strength) {
      case "high":
        return "High Match"
      case "medium":
        return "Medium Match"
      case "low":
        return "Low Match"
      default:
        return "Match"
    }
  }

  const handleConnect = () => {
    onConnect?.(traveler.id)
  }

  const handleViewProfile = () => {
    onViewProfile?.(traveler.id)
  }

  return (
    <Card className="w-80 h-[420px] bg-white border border-gray-200 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 ease-in-out overflow-hidden group cursor-pointer">
      {/* Profile Photo Section */}
      <div className="relative w-full h-44 bg-gray-100 overflow-hidden">
        {!imageError ? (
          <>
            {/* Loading skeleton */}
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gray-200 animate-pulse">
                <div className="w-full h-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse" />
              </div>
            )}
            <Image
              src={traveler.profilePhoto || "/placeholder.svg"}
              alt={`${traveler.name}'s profile photo`}
              fill
              className={`object-cover transition-all duration-500 group-hover:scale-105 ${
                imageLoaded ? "opacity-100" : "opacity-0"
              }`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </>
        ) : (
          /* Fallback placeholder */
          <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-100 to-gray-200">
            <User className="w-16 h-16 text-gray-400" />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

        {/* Match Strength Badge */}
        <div className="absolute top-3 right-3 z-10">
          <Badge
            className={`w-6 h-6 p-0 rounded-full border-2 ${getMatchBadgeColor(traveler.matchStrength)} text-transparent hover:scale-110 transition-transform duration-200`}
            aria-label={getMatchBadgeText(traveler.matchStrength)}
            title={getMatchBadgeText(traveler.matchStrength)}
          >
            <span className="sr-only">{getMatchBadgeText(traveler.matchStrength)}</span>
          </Badge>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-5 flex flex-col h-60">
        {/* Name & Age */}
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-gray-900 leading-tight">
            {traveler.name}, <span className="font-normal text-gray-600">{traveler.age}</span>
          </h3>
        </div>

        {/* Destination */}
        <div className="flex items-center mb-2 text-gray-700">
          <MapPin className="w-4 h-4 mr-2 text-blue-600 flex-shrink-0" aria-hidden="true" />
          <span className="text-base font-medium truncate">{traveler.destination}</span>
        </div>

        {/* Travel Dates */}
        <div className="flex items-center mb-3 text-gray-600">
          <Calendar className="w-4 h-4 mr-2 text-gray-500 flex-shrink-0" aria-hidden="true" />
          <span className="text-sm truncate">{traveler.travelDates}</span>
        </div>

        {/* Bio */}
        <div className="flex-1 mb-4">
          <p className="text-sm text-gray-600 leading-relaxed line-clamp-3" title={traveler.bio}>
            {traveler.bio}
          </p>
        </div>

        {/* CTA Button */}
        <Button
          onClick={traveler.matchStrength === "high" ? handleConnect : handleViewProfile}
          className="w-full h-11 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 active:scale-95 text-white font-semibold rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label={`${traveler.matchStrength === "high" ? "Connect with" : "View profile of"} ${traveler.name}`}
        >
          {traveler.matchStrength === "high" ? "Connect" : "View Profile"}
        </Button>
      </div>
    </Card>
  )
}
