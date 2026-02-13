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
      return;
    }

    if (groups.length === 0) {
      setEvents([]);
      setLoading(false);
      return;
    }

    const fetchAllGroupEvents = async () => {
      try {
        setLoading(true);
        setError(null);

        const allEvents: CalendarEvent[] = [];
        // Only get groups where user is a member (status is 'accepted')
        const memberGroups = groups.filter(
          (g) => g.status === "accepted" && g.group?.id
        );
        const groupIds = memberGroups.map((g) => g.group!.id);

        if (groupIds.length === 0) {
          setEvents([]);
          return;
        }

        for (const groupId of groupIds) {
          try {
            const response = await fetch(`/api/Itinerary?groupId=${groupId}`);

            if (!response.ok) {
              console.error(
                `❌ Failed to fetch itinerary for group ${groupId}: ${response.status}`
              );
              continue; // Skip this group but continue with others
            }

            const data: ItineraryItem[] = await response.json();

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

/** Clean minimal skeleton: header + day sections with simple bar placeholders */
function ItinerarySkeleton() {
  return (
    <div
      className="bg-card flex flex-col h-full min-h-0 rounded-xl border border-border overflow-hidden"
      aria-hidden
      aria-busy
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-3.5 flex-shrink-0 border-b border-border/50">
        <Skeleton className="h-4 w-28 rounded flex-1 max-w-[140px]" />
        <Skeleton className="h-4 w-28 rounded flex-1 max-w-[140px]" />
      </div>

      {/* Content: uniform day + event bars, no boxes */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
        {[1, 2, 3, 4, 5].map((dayIdx) => (
          <div
            key={dayIdx}
            className="pt-4 first:pt-0 mt-6 first:mt-0 border-t border-border/50 first:border-t-0"
          >
            <Skeleton className="h-4 w-32 rounded mb-4" />
            <div className="space-y-3 pl-0">
              <div className="space-y-1.5">
                <Skeleton className="h-8 w-full rounded" />
              </div>
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-full rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ItineraryUI() {
  const { events, loading, error } = useItineraryEvents();

  const handleEventAdd = (event: CalendarEvent) => {
    // This would need to be implemented to add events to the backend
  };

  const handleEventUpdate = (updatedEvent: CalendarEvent) => {
    // This would need to be implemented to update events in the backend
  };

  const handleEventDelete = (eventId: string) => {
    // This would need to be implemented to delete events from the backend
  };

  if (loading) {
    return (
      <div className="flex flex-col w-full h-full min-h-0 flex-1">
        <ItinerarySkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col w-full h-full min-h-0 bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex flex-1 min-h-0 items-center justify-center p-8">
          <div className="text-center">
            <p className="text-sm text-destructive mb-2">
              Error loading events
            </p>
            <p className="text-xs text-muted-foreground">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (events.length === 0 && !loading) {
    return (
      <div className="bg-card border border-border rounded-xl h-full min-h-0 flex flex-col overflow-hidden">
        <div className="mb-3 p-4 border-b border-border flex-shrink-0">
          <h2 className="text-foreground font-semibold text-xs truncate">
            Itinerary
          </h2>
          <p className="mt-0.5 text-muted-foreground text-xs">
            Your upcoming events and activities
          </p>
        </div>
        <div className="flex flex-1 min-h-0 flex-col items-center justify-center py-24 text-center">
          <p className="text-xs font-medium text-muted-foreground">
            No events found
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            There are no events scheduled for this time period.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0 flex-1">
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
