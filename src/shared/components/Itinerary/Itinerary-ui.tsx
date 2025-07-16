"use client"

import { useState } from "react"
import { Card } from "../ui/card"
import { Button } from "../ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu"
import { MoreHorizontal } from "lucide-react"
import { cn } from "../../utils/utils"
import { ManageEventsModal } from "./manage-events-modal"
import { formatTime } from "../../utils/utils"
import React from "react"

interface ItineraryEvent {
  id: string
  time: {
    hour: number
    minute: number
    ampm: "AM" | "PM"
  }
  label?: string
  description: string
  duration: string
  active: boolean
}

interface ItineraryDay {
  id: number
  name: string
  events: ItineraryEvent[]
}

export default function ItineraryUI({ cardClassName = "", itineraryDays: propItineraryDays }: { cardClassName?: string, itineraryDays?: ItineraryDay[] }) {
  const itineraryDays = propItineraryDays || [];
  // Only initialize from props ONCE
  const [activeDayId, setActiveDayId] = useState(itineraryDays[0]?.id || 1);

  // DO NOT use useEffect to update activeDayId from props!
  // Remove any useEffect that does this.

  const activeDay = itineraryDays.find((day) => day.id === activeDayId);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "delete" | null>(null);

  if (!itineraryDays || itineraryDays.length === 0) {
    return (
      <Card className={cn("w-full max-w-sm sm:max-w-md lg:max-w-lg mx-auto bg-white p-6 rounded-2xl shadow-md", cardClassName)}>
        <div className="text-center text-gray-500">No itinerary data available.</div>
      </Card>
    );
  }

  const handleOpenModal = (mode: "add" | "edit" | "delete") => {
    setModalMode(mode)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setModalMode(null)
  }

  // If you want to keep these handlers for future editing, add types:
  const handleSaveEvent = (newEvent: ItineraryEvent) => {
    // Disabled: itineraryDays is now read-only from props
    // Example typing if you re-enable:
    // setItineraryDays((prevDays: ItineraryDay[]) =>
    //   prevDays.map((day: ItineraryDay) => {
    //     if (day.id === activeDayId) {
    //       if (modalMode === "add") {
    //         return { ...day, events: [...day.events, newEvent] }
    //       } else if (modalMode === "edit") {
    //         return {
    //           ...day,
    //           events: day.events.map((event: ItineraryEvent) => (event.id === newEvent.id ? newEvent : event)),
    //         }
    //       }
    //     }
    //     return day
    //   }),
    // )
  }

  const handleDeleteEvent = (eventId: string) => {
    // Disabled: itineraryDays is now read-only from props
    // Example typing if you re-enable:
    // setItineraryDays((prevDays: ItineraryDay[]) =>
    //   prevDays.map((day: ItineraryDay) => {
    //     if (day.id === activeDayId) {
    //       return { ...day, events: day.events.filter((event: ItineraryEvent) => event.id !== eventId) }
    //     }
    //     return day
    //   }),
    // )
  }

  return (
    <Card className={cn("w-full max-w-sm sm:max-w-md lg:max-w-lg mx-auto bg-white p-6 rounded-2xl shadow-md", cardClassName)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h2 className="text-black text-lg sm:text-xl font-medium">Itinerary</h2>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
              <MoreHorizontal className="h-5 w-5 text-gray-500" />
              <span className="sr-only">More options</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => handleOpenModal("add")}>Add Event</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handleOpenModal("edit")}>Edit Event</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handleOpenModal("delete")}>Delete Event</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Day Tabs */}
      <div className="overflow-x-auto scrollbar-hide flex overflow-y-hidden pb-4 -mx-4 px-4 sm:-mx-6 sm:px-6">
        {itineraryDays.map((day) => (
          <Button
            key={day.id}
            variant="ghost"
            onClick={() => setActiveDayId(day.id)}
            className={cn(
              "flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors",
              activeDayId === day.id
                ? "bg-gray-900 text-white shadow-sm"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200",
              "mr-2 last:mr-0",
            )}
          >
            {day.name}
          </Button>
        ))}
      </div>

      {/* Timeline */}
      <div className="mt-6 relative">
        {activeDay?.events.length === 0 && (
          <p className="text-center text-gray-500">No events for this day. Add one!</p>
        )}
        {activeDay?.events.map((event, index) => (
          <div key={event.id} className="flex relative">
            <div className="flex flex-col items-end pr-4 w-[90px] flex-shrink-0 pt-1">
              <div className="text-sm font-medium text-gray-900 text-right">{formatTime(event.time)}</div>
              {event.label && <div className="text-xs text-gray-500 text-right">{event.label}</div>}
            </div>
            <div className="relative flex-shrink-0 w-9 flex justify-center">
              {index < activeDay.events.length - 1 && (
                <div
                  className={cn(
                    "absolute top-[18px] w-0.5",
                    "h-[calc(100%+18px)]",
                    event.active ? "bg-gray-400" : "bg-gray-200",
                  )}
                />
              )}
              <div
                className={cn(
                  "relative z-10 w-9 h-9 flex items-center justify-center",
                  "rounded-full border-2",
                  event.active ? "border-gray-900 bg-gray-900" : "border-gray-200 bg-gray-200",
                )}
              >
                <div className={cn("w-3 h-3 rounded-full", event.active ? "bg-white" : "bg-gray-400")} />
              </div>
            </div>
            <div className="ml-4 pb-8 grid gap-0.5 flex-1 min-w-0 pt-1">
              <div className="text-base font-semibold text-gray-900 leading-tight">{event.description}</div>
              <div className="text-sm text-gray-500">{`Duration ${event.duration}`}</div>
            </div>
          </div>
        ))}
      </div>

      <ManageEventsModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        mode={modalMode}
        events={activeDay?.events || []}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
      />
    </Card>
  )
}
