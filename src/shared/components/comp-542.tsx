"use client";

import { useState, useEffect } from "react";
import { addDays, setHours, setMinutes, subDays } from "date-fns";

import { EventCalendar } from "@/shared/components/event-calendar/event-calendar";
import type { CalendarEvent } from "@/shared/components/event-calendar/types";

// Type for itinerary item from API
interface ItineraryItem {
  id: string;
  group_id: string;
  title: string;
  description?: string;
  datetime: string;
  status?: string;
  location?: string;
  priority?: string;
  notes?: string;
  assigned_to?: string;
  image_url?: string;
  external_link?: string;
  created_at: string;
  is_archived?: boolean;
  duration?: string;
}

// Hook to fetch itinerary events
const useItineraryEvents = (groupId?: string) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!groupId) {
      setEvents([]);
      return;
    }

    const fetchEvents = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/Itinerary?groupId=${groupId}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch itinerary: ${response.status}`);
        }

        const data: ItineraryItem[] = await response.json();

        // Transform itinerary data to CalendarEvent format
        console.log("Raw itinerary data:", data);

        const transformedEvents: CalendarEvent[] = data
          .filter((item: ItineraryItem) => {
            // Filter out items with invalid dates
            const startDate = new Date(item.datetime);
            return !isNaN(startDate.getTime());
          })
          .map((item: ItineraryItem) => {
            const startDate = new Date(item.datetime);
            // Calculate end date based on duration or default to 1 hour
            let endDate: Date;
            if (item.duration) {
              // If duration is in minutes, convert to milliseconds
              const durationMs = parseInt(item.duration) * 60 * 1000;
              endDate = new Date(startDate.getTime() + durationMs);
            } else {
              // Default to 1 hour if no duration specified
              endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
            }

            return {
              id: item.id,
              title: item.title,
              description: item.description || "",
              start: startDate,
              end: endDate,
              allDay: false, // Since there's no type field, default to false
              color: getRandomEventColor(),
              location: item.location || "",
            };
          });

        console.log("Transformed events:", transformedEvents);
        setEvents(transformedEvents);
      } catch (err) {
        console.error("Error fetching itinerary events:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch events");
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [groupId]);

  return { events, loading, error };
};

// Available colors for events
const eventColors: CalendarEvent["color"][] = [
  "sky",
  "amber",
  "violet",
  "rose",
  "emerald",
  "orange",
];

// Helper function to assign random colors to events
const getRandomEventColor = (): CalendarEvent["color"] => {
  const randomIndex = Math.floor(Math.random() * eventColors.length);
  return eventColors[randomIndex];
};

interface ItineraryUIProps {
  groupId?: string;
}

export default function ItineraryUI({ groupId }: ItineraryUIProps) {
  const { events, loading, error } = useItineraryEvents(groupId);

  const handleEventAdd = (event: CalendarEvent) => {
    // This would need to be implemented to add events to the backend
    console.log("Add event:", event);
  };

  const handleEventUpdate = (updatedEvent: CalendarEvent) => {
    // This would need to be implemented to update events in the backend
    console.log("Update event:", updatedEvent);
  };

  const handleEventDelete = (eventId: string) => {
    // This would need to be implemented to delete events from the backend
    console.log("Delete event:", eventId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading itinerary events...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-sm text-red-600 mb-2">Error loading events</p>
          <p className="text-xs text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!groupId) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-sm text-gray-600">No group selected</p>
          <p className="text-xs text-gray-500">
            Select a group to view itinerary events
          </p>
        </div>
      </div>
    );
  }

  if (events.length === 0 && !loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-sm text-gray-600">No itinerary events found</p>
          <p className="text-xs text-gray-500">
            Create some events in your group's itinerary to see them here
          </p>
        </div>
      </div>
    );
  }

  return (
    <EventCalendar
      events={events}
      onEventAdd={handleEventAdd}
      onEventUpdate={handleEventUpdate}
      onEventDelete={handleEventDelete}
    />
  );
}
