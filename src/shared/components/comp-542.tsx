"use client";

import { useState, useEffect } from "react";
import { addDays, setHours, setMinutes, subDays } from "date-fns";

import { EventCalendar } from "@/shared/components/event-calendar/event-calendar";
import type { CalendarEvent } from "@/shared/components/event-calendar/types";
import { useUserGroups } from "@/shared/hooks/useUserGroups";
import { Skeleton } from "@heroui/react";

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

// Hook to fetch itinerary events for all user groups
const useItineraryEvents = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { groups, loading: groupsLoading } = useUserGroups();

  useEffect(() => {
    // Only proceed if groups are loaded and we have groups
    if (groupsLoading) {
      console.log("⏳ Still loading user groups...");
      return;
    }

    if (groups.length === 0) {
      console.log("📭 No user groups found");
      setEvents([]);
      setLoading(false);
      return;
    }

    const fetchAllGroupEvents = async () => {
      try {
        console.log("🚀 Starting to fetch itinerary data for all user groups");
        setLoading(true);
        setError(null);

        console.log("📊 Total user groups:", groups.length);
        console.log(
          "📋 User group IDs:",
          groups.map((g) => g.group?.id).filter(Boolean)
        );

        const allEvents: CalendarEvent[] = [];
        // Only get groups where user is a member (status is 'accepted')
        const memberGroups = groups.filter(
          (g) => g.status === "accepted" && g.group?.id
        );
        const groupIds = memberGroups.map((g) => g.group!.id);

        console.log("👥 Groups where user is a member:", groupIds);
        console.log("📊 Total member groups:", groupIds.length);

        if (groupIds.length === 0) {
          console.log(
            "📭 No member groups found - user is not a member of any groups"
          );
          setEvents([]);
          return;
        }

        for (const groupId of groupIds) {
          try {
            console.log(`🔍 Fetching itinerary for group: ${groupId}`);
            const response = await fetch(`/api/Itinerary?groupId=${groupId}`);

            console.log(
              `📡 API Response status for group ${groupId}:`,
              response.status
            );
            console.log(
              `📡 API Response ok for group ${groupId}:`,
              response.ok
            );

            if (!response.ok) {
              console.error(
                `❌ Failed to fetch itinerary for group ${groupId}: ${response.status}`
              );
              continue; // Skip this group but continue with others
            }

            const data: ItineraryItem[] = await response.json();

            // Log all raw itinerary data for this group
            console.log(`📋 Raw itinerary data for group ${groupId}:`, data);
            console.log(`📊 Total items for group ${groupId}:`, data.length);

            // Log each item individually for detailed inspection
            data.forEach((item, index) => {
              console.log(`📝 Group ${groupId} - Item ${index + 1}:`, {
                id: item.id,
                group_id: item.group_id,
                title: item.title,
                description: item.description,
                datetime: item.datetime,
                status: item.status,
                location: item.location,
                priority: item.priority,
                notes: item.notes,
                assigned_to: item.assigned_to,
                image_url: item.image_url,
                external_link: item.external_link,
                created_at: item.created_at,
                is_archived: item.is_archived,
                duration: item.duration,
              });
            });

            // Transform itinerary data to CalendarEvent format
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

            console.log(
              `🔄 Transformed events for group ${groupId}:`,
              transformedEvents
            );
            console.log(
              `✅ Final events count for group ${groupId}:`,
              transformedEvents.length
            );

            allEvents.push(...transformedEvents);
          } catch (err) {
            console.error(
              `❌ Error fetching itinerary events for group ${groupId}:`,
              err
            );
            console.error(`❌ Error details for group ${groupId}:`, {
              message: err instanceof Error ? err.message : "Unknown error",
              stack: err instanceof Error ? err.stack : undefined,
            });
            // Continue with other groups even if one fails
          }
        }

        console.log("🎯 All events combined:", allEvents);
        console.log("🎯 Total combined events count:", allEvents.length);
        setEvents(allEvents);
      } catch (err) {
        console.error("❌ Error in fetchAllGroupEvents:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch events");
      } finally {
        setLoading(false);
      }
    };

    fetchAllGroupEvents();
  }, [groups, groupsLoading]);

  // Ensure loading state is properly managed
  const isLoading = loading || groupsLoading;

  return { events, loading: isLoading, error };
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

export default function ItineraryUI() {
  const { events, loading, error } = useItineraryEvents();

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
      <div className="flex flex-col w-full h-full">
        <Skeleton className="h-full w-full rounded-xl" />
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

  if (events.length === 0 && !loading) {
    return (
      <div className="bg-card !border !border-border rounded-2xl md:h-[90vh] h-full flex flex-col">
        <div className="mb-3 p-4 border-b border-border flex-shrink-0">
          <h2 className="text-foreground font-semibold text-xs truncate">
            Itinerary
          </h2>
          <p className="mt-0.5 text-muted-foreground text-xs">
            Your upcoming events and activities
          </p>
        </div>
        <div className="flex flex-col items-center justify-center py-24 text-center flex-1">
          <p className="text-xs text-muted-foreground">
            No itinerary events found
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Create some events in your groups&apos; itineraries to see them here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* <div className="mb-3 p-4 border-b border-border flex-shrink-0">
        <h2 className="text-foreground font-semibold text-xs truncate">
          Itinerary
        </h2>
        <p className="mt-0.5 text-muted-foreground text-xs">
          {events.length} {events.length === 1 ? "event" : "events"} scheduled
        </p>
      </div> */}
      <div className="flex-1 min-h-0">
        <EventCalendar
          events={events}
          onEventAdd={handleEventAdd}
          onEventUpdate={handleEventUpdate}
          onEventDelete={handleEventDelete}
        />
      </div>
    </div>
  );
}
