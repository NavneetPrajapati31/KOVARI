"use client"

import { useUserGroups } from "@/shared/hooks/useUserGroups"
import { MapPin } from "lucide-react"

interface Trip {
  id: string
  city: string
  dates: string
  duration: string
  image: string
  isCompleted: boolean
}

export default function DoneTripsWidget() {
  const { groups, loading } = useUserGroups()

  // Filter for completed trips (end_date in the past)
  const completedTrips: Trip[] = groups
    .filter(
      (g) =>
        g.group &&
        g.group.end_date &&
        new Date(g.group.end_date) < new Date()
    )
    .map((g) => ({
      id: g.group!.id,
      city: g.group!.name,
      dates:
        g.group!.start_date && g.group!.end_date
          ? `${new Date(g.group!.start_date).toLocaleDateString("en-US", { day: "numeric", month: "short" })} - ${new Date(g.group!.end_date).toLocaleDateString("en-US", { day: "numeric", month: "short" })}`
          : "",
      duration:
        g.group!.start_date && g.group!.end_date
          ? `${Math.round(
              (new Date(g.group!.end_date).getTime() - new Date(g.group!.start_date).getTime()) /
                (1000 * 60 * 60 * 24) + 1
            )} days`
          : "",
      image: g.group!.cover_image || "/placeholder.svg?height=40&width=40",
      isCompleted: true,
    }))

  const LoadingSkeleton = () => (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-gray-800 rounded-xl p-4 flex items-center gap-4 animate-pulse">
          <div className="w-10 h-10 bg-gray-700 rounded-full"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-700 rounded w-20 mb-2"></div>
            <div className="h-3 bg-gray-700 rounded w-24"></div>
          </div>
          <div className="h-3 bg-gray-700 rounded w-12"></div>
        </div>
      ))}
    </div>
  )

  return (
    <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg mx-auto bg-white p-6 rounded-2xl shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h2 className="text-black text-lg sm:text-xl font-medium">Done Trip</h2>
          <span className="bg-white text-black text-xs px-2 py-1 rounded-full">{completedTrips.length}</span>
        </div>
      </div>

      {/* Trips List */}
      {loading ? (
        <LoadingSkeleton />
      ) : (
        <div className="space-y-3 max-h-96 sm:max-h-[500px] overflow-y-auto hide-scrollbar">
          {completedTrips.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-black text-sm">No completed trips yet</p>
              <p className="text-black text-xs mt-1">Add your first trip above</p>
            </div>
          ) : (
            completedTrips.map((trip) => (
              <div key={trip.id} className="bg-white rounded-xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
                {/* City Image */}
                <div className="flex-shrink-0">
                  <img
                    src={trip.image || "/placeholder.svg"}
                    alt={trip.city}
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover"
                  />
                </div>

                {/* Trip Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-black text-sm sm:text-base font-medium truncate">{trip.city}</h3>
                  <p className="text-gray-400 text-xs sm:text-sm mt-0.5 truncate">{trip.dates}</p>
                </div>

                {/* Duration and Remove Button */}
                <div className="flex-shrink-0">
                  <span className="text-gray-400 text-xs sm:text-sm">{trip.duration}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Footer Stats */}
      {completedTrips.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-800">
          <div className="flex justify-between text-xs text-black-400">
            <span>{completedTrips.length} trips completed</span>
            <span>
              {completedTrips.reduce((total, trip) => {
                const days = Number.parseInt(trip.duration.split(" ")[0])
                return total + (isNaN(days) ? 0 : days)
              }, 0)}{" "}
              total days
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
