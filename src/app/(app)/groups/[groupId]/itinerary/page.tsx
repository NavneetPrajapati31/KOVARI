"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  Calendar,
  MoreHorizontal,
  MessageCircle,
  Users,
} from "lucide-react";
import { Chip, Spinner } from "@heroui/react";
import { createClient } from "@/lib/supabase";

interface ItineraryItem {
  id: string;
  title: string;
  description: string;
  datetime: string;
  type: string;
  status: "planned" | "confirmed" | "in-progress" | "completed" | "cancelled";
  location: string;
  priority: "low" | "medium" | "high";
  assigned_to?: string[];
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

interface GroupMember {
  id: string;
  name: string;
  avatar: string;
  username: string;
}

const COLUMNS = [
  { id: "planned", title: "Planned", color: "bg-blue-50 border-blue-200" },
  {
    id: "confirmed",
    title: "Confirmed",
    color: "bg-green-50 border-green-200",
  },
  {
    id: "in-progress",
    title: "In Progress",
    color: "bg-yellow-50 border-yellow-200",
  },
  { id: "completed", title: "Completed", color: "bg-gray-50 border-gray-200" },
  { id: "cancelled", title: "Cancelled", color: "bg-red-50 border-red-200" },
] as const;

const PRIORITY_COLORS = {
  low: "bg-gray-100 text-gray-700 border-gray-300",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-300",
  high: "bg-red-100 text-red-700 border-red-300",
};

const TYPE_ICONS = {
  accommodation: "🏨",
  transportation: "🚗",
  activity: "🎯",
  food: "🍽️",
  sightseeing: "👁️",
  shopping: "🛍️",
  entertainment: "🎭",
  other: "📝",
};

const TYPE_COLORS = {
  accommodation: "bg-purple-100 text-purple-700 border-purple-300",
  transportation: "bg-blue-100 text-blue-700 border-blue-300",
  activity: "bg-green-100 text-green-700 border-green-300",
  food: "bg-orange-100 text-orange-700 border-orange-300",
  sightseeing: "bg-indigo-100 text-indigo-700 border-indigo-300",
  shopping: "bg-pink-100 text-pink-700 border-pink-300",
  entertainment: "bg-yellow-100 text-yellow-700 border-yellow-300",
  other: "bg-gray-100 text-gray-700 border-gray-300",
};

// Add a mapping for UI status to DB status
const STATUS_MAP: Record<
  string,
  "confirmed" | "pending" | "cancelled" | "completed"
> = {
  planned: "pending",
  "in-progress": "confirmed",
  completed: "completed",
  confirmed: "confirmed",
  cancelled: "cancelled",
  pending: "pending",
};

// Map DB status to UI column id
const dbStatusToColumnId = (status: string) => {
  if (status === "pending") return "planned";
  if (status === "confirmed") return "in-progress";
  if (status === "completed") return "completed";
  if (status === "cancelled") return "cancelled";
  return "planned";
};

export default function ItineraryPage() {
  const params = useParams<{ groupId: string }>();
  const [itineraryItems, setItineraryItems] = useState<ItineraryItem[]>([]);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ItineraryItem | null>(null);
  const [draggedItem, setDraggedItem] = useState<ItineraryItem | null>(null);

  // Form state for new/edit item
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    datetime: "",
    type: "other",
    location: "",
    priority: "medium" as "low" | "medium" | "high",
    assigned_to: [] as string[],
  });

  // --- NEW: Status/Column definitions for minimal UI ---
  const BOARD_COLUMNS = [
    {
      id: "planned",
      title: "To do",
      color: "bg-orange-50 text-orange-700",
      dot: "#F59E0B",
    },
    {
      id: "in-progress",
      title: "In Progress",
      color: "bg-blue-50 text-blue-700",
      dot: "#3B82F6",
    },
    {
      id: "completed",
      title: "Done",
      color: "bg-purple-50 text-purple-700",
      dot: "#8B5CF6",
    },
    {
      id: "cancelled",
      title: "Cancelled",
      color: "bg-red-50 text-red-700",
      dot: "#B91C1C",
    },
  ];

  // --- NEW: Status badge mapping ---
  const COLUMN_BADGES: Record<string, { label: string; color: string }> = {
    planned: { label: "Not Started", color: "bg-blue-50 text-blue-700" },
    "in-progress": {
      label: "In Progress",
      color: "bg-purple-50 text-purple-700",
    },
    completed: { label: "Complete", color: "bg-green-50 text-green-700" },
    cancelled: { label: "Cancelled", color: "bg-red-50 text-red-700" },
  };

  // --- NEW: Priority badge mapping ---
  const PRIORITY_BADGES: Record<string, string> = {
    low: "bg-[#F4F4F5] text-[#71717A]",
    medium: "bg-[#FEF3C7] text-[#B54708]",
    high: "bg-[#FEE2E2] text-[#B91C1C]",
  };

  // --- NEW: Meta info icons (SVG inline for comments, links, checklist) ---
  const MetaIcon = {
    comments: (
      <svg
        className="w-4 h-4 inline-block mr-1"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    links: (
      <svg
        className="w-4 h-4 inline-block mr-1"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M10 13a5 5 0 0 1 7 7l-1 1a5 5 0 0 1-7-7m1-1a5 5 0 0 1 7-7l1 1a5 5 0 0 1-7 7" />
      </svg>
    ),
    checklist: (
      <svg
        className="w-4 h-4 inline-block mr-1"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M5 13l4 4L19 7" />
      </svg>
    ),
  };

  useEffect(() => {
    // [DEBUG] useEffect called, params.groupId: ...
    // [DEBUG] Supabase URL: ...
    // [DEBUG] Supabase ANON KEY: ...
    fetchItineraryData();
    fetchGroupMembers();
    // --- Supabase realtime subscription temporarily disabled ---
    /*
    const supabase = createClient();
    // [DEBUG] Supabase client created
    const channel = supabase
      .channel("itinerary-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "itinerary_items",
          // filter: `group_id=eq.${params.groupId}`,
        },
        (payload) => {
          console.log("[Supabase Realtime] Event:", payload.eventType, payload);
          if (payload.eventType === "INSERT") {
            setItineraryItems((prev) => {
              if (prev.some((item) => item.id === payload.new.id)) return prev;
              const updated = [...prev, payload.new as ItineraryItem];
              console.log("[Supabase Realtime] After INSERT:", updated);
              return updated;
            });
          } else if (payload.eventType === "UPDATE") {
            setItineraryItems((prev) => {
              const updated = prev.map((item) =>
                item.id === payload.new.id
                  ? { ...(payload.new as ItineraryItem) }
                  : item
              );
              console.log("[Supabase Realtime] After UPDATE:", updated);
              return updated;
            });
          } else if (payload.eventType === "DELETE") {
            setItineraryItems((prev) => {
              const updated = prev.filter(
                (item) => item.id !== (payload.old as ItineraryItem).id
              );
              console.log("[Supabase Realtime] After DELETE:", updated);
              return updated;
            });
          }
        }
      )
      .subscribe();
    // [DEBUG] Subscribed to Supabase channel
    return () => {
      supabase.removeChannel(channel);
      // [DEBUG] Unsubscribed from Supabase channel
    };
    */
  }, [params.groupId]);

  const fetchItineraryData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/groups/${params.groupId}/itinerary`);
      if (!response.ok) throw new Error("Failed to fetch itinerary");
      const data = await response.json();
      setItineraryItems(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupMembers = async () => {
    try {
      const response = await fetch(`/api/groups/${params.groupId}/members`);
      if (!response.ok) throw new Error("Failed to fetch members");
      const data = await response.json();
      setGroupMembers(data.members || []);
    } catch (err) {
      console.error("Failed to fetch members:", err);
    }
  };

  const handleAddItem = async () => {
    try {
      const response = await fetch(`/api/groups/${params.groupId}/itinerary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          status: STATUS_MAP["planned"],
          group_id: params.groupId,
          assigned_to: Array.isArray(formData.assigned_to)
            ? formData.assigned_to
            : [],
          title: formData.title,
          datetime: formData.datetime,
          type: formData.type,
        }),
      });

      if (!response.ok) throw new Error("Failed to add item");

      setIsAddDialogOpen(false);
      resetForm();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleUpdateItem = async () => {
    if (!editingItem) return;

    try {
      const response = await fetch(
        `/api/groups/${params.groupId}/itinerary/${editingItem.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            status: STATUS_MAP[editingItem.status as string] || "confirmed",
            assigned_to: Array.isArray(formData.assigned_to)
              ? formData.assigned_to
              : [],
            group_id: params.groupId,
            title: formData.title,
            datetime: formData.datetime,
            type: formData.type,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to update item");

      setIsEditDialogOpen(false);
      setEditingItem(null);
      resetForm();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      const response = await fetch(
        `/api/groups/${params.groupId}/itinerary/${itemId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) throw new Error("Failed to delete item");
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleStatusUpdate = async (
    itemId: string,
    newStatus: ItineraryItem["status"]
  ) => {
    try {
      // Find the full item
      const item = itineraryItems.find((i) => i.id === itemId);
      if (!item) throw new Error("Item not found");

      // Send the full item with updated status
      const response = await fetch(
        `/api/groups/${params.groupId}/itinerary/${itemId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...item,
            status: STATUS_MAP[newStatus as string] || "confirmed",
            assigned_to: Array.isArray(item.assigned_to)
              ? item.assigned_to
              : [],
            group_id: (item as any).group_id
              ? (item as any).group_id
              : params.groupId,
            title: item.title,
            datetime: item.datetime,
            type: item.type,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to update status");
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      datetime: "",
      type: "other",
      location: "",
      priority: "medium",
      assigned_to: [],
    });
  };

  const openEditDialog = (item: ItineraryItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      description: item.description,
      datetime: item.datetime,
      type: item.type,
      location: item.location,
      priority: item.priority,
      assigned_to: item.assigned_to || [],
    });
    setIsEditDialogOpen(true);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, item: ItineraryItem) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, status: ItineraryItem["status"]) => {
    e.preventDefault();
    if (draggedItem && draggedItem.status !== status) {
      // Optimistically update local state
      setItineraryItems((prev) =>
        prev.map((item) =>
          item.id === draggedItem.id ? { ...item, status } : item
        )
      );
      // Send update to backend
      handleStatusUpdate(draggedItem.id, status);
    }
    setDraggedItem(null);
  };

  // Filter and search
  const filteredItems = itineraryItems.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || item.type === filterType;
    const matchesPriority =
      filterPriority === "all" || item.priority === filterPriority;

    return matchesSearch && matchesType && matchesPriority;
  });

  const getItemsByStatus = (status: ItineraryItem["status"]) => {
    return filteredItems.filter(
      (item) => dbStatusToColumnId(item.status) === status
    );
  };

  const formatDateTime = (datetime: string) => {
    const date = new Date(datetime);
    return {
      date: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      time: date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Spinner variant="spinner" size="md" color="primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center text-destructive">
              <p className="font-medium">Error loading itinerary</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- NEW: Responsive, minimal board UI ---
  return (
    <div className="space-y-6 bg-gray-50 min-h-screen p-2">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">
            Itinerary Board
          </h1>
          <p className="text-sm text-gray-600">
            Plan and organize your group's travel activities
          </p>
        </div>

        {/* Right side - Team avatars and action buttons */}
        <div className="flex items-center gap-4">
          {/* Team member avatars */}
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {groupMembers.slice(0, 4).map((member) => (
                <img
                  key={member.id}
                  src={member.avatar || "/placeholder-user.jpg"}
                  alt={member.name}
                  className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                  title={member.name}
                />
              ))}
              {groupMembers.length > 4 && (
                <div className="w-8 h-8 rounded-full border-2 border-white shadow-sm bg-gray-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-600">
                    +{groupMembers.length - 4}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <Button
              className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg font-medium"
              onClick={() => {
                // Handle invite member action
                console.log("Invite member clicked");
              }}
            >
              <Users className="w-4 h-4 mr-2" />
              <span className="text-sm">Invite Member</span>
            </Button>

            <Button
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg font-medium"
              onClick={() => {
                // Handle share action
                console.log("Share clicked");
              }}
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
              <span className="text-sm">Share</span>
            </Button>
          </div>

          {/* Add Item button - moved here for better layout */}
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4" />
                <span className="text-sm">Add Item</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add Itinerary Item</DialogTitle>
                <DialogDescription>
                  Create a new activity or event for your group's itinerary.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="Activity title"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Activity description"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Date & Time</label>
                    <Input
                      type="datetime-local"
                      value={formData.datetime}
                      onChange={(e) =>
                        setFormData({ ...formData, datetime: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Type</label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) =>
                        setFormData({ ...formData, type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(TYPE_ICONS).map(([key, icon]) => (
                          <SelectItem key={key} value={key}>
                            <span className="flex items-center gap-2">
                              <span>{icon}</span>
                              <span className="capitalize">{key}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Location</label>
                    <Input
                      value={formData.location}
                      onChange={(e) =>
                        setFormData({ ...formData, location: e.target.value })
                      }
                      placeholder="Location"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Priority</label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value: "low" | "medium" | "high") =>
                        setFormData({ ...formData, priority: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleAddItem}>Add Item</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Board Columns */}
      <div className="flex gap-4 pb-4">
        {BOARD_COLUMNS.map((column) => {
          const filteredItems = itineraryItems.filter(
            (item) => dbStatusToColumnId(item.status) === column.id
          );

          return (
            <div
              key={column.id}
              className="max-w-[320px] w-full bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col"
              onDragOver={handleDragOver}
              onDrop={(e) =>
                handleDrop(e, column.id as ItineraryItem["status"])
              }
            >
              {/* Column Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: column.dot }}
                  ></span>
                  <span className="font-medium text-gray-900 text-sm">
                    {column.title}
                  </span>
                  <span className="ml-1 text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5 min-w-[20px] text-center">
                    {filteredItems.length}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 transition-colors"
                    onClick={() => setIsAddDialogOpen(true)}
                    aria-label="Add task"
                  >
                    <Plus className="w-4 h-4 text-gray-500" />
                  </button>
                  <button
                    className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 transition-colors"
                    aria-label="Column actions"
                  >
                    <MoreHorizontal className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Tasks */}
              <div className="flex-1 flex flex-col gap-3 p-4">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 flex flex-col gap-3 relative transition-shadow cursor-pointer"
                    draggable
                    onDragStart={(e) => handleDragStart(e, item)}
                    onClick={() => openEditDialog(item)}
                  >
                    {/* Status badge */}
                    {(() => {
                      const columnId = dbStatusToColumnId(item.status);
                      const badge = COLUMN_BADGES[columnId];
                      return (
                        <Chip
                          className={`inline-flex items-center text-xs font-medium rounded-full px-2 py-1 ${
                            badge?.color || "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {badge?.label || columnId}
                        </Chip>
                      );
                    })()}

                    {/* Title & Description */}
                    <div className="space-y-1">
                      <h3 className="font-medium text-gray-900 text-sm leading-tight">
                        {item.title}
                      </h3>
                      <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                        {item.description}
                      </p>
                    </div>

                    {/* Assignees and Due Date */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">
                          Assignees :
                        </span>
                        <div className="flex -space-x-1">
                          {(item.assigned_to || [])
                            .slice(0, 3)
                            .map((uid, index) => {
                              const member = groupMembers.find(
                                (m) => m.id === uid
                              );
                              return member ? (
                                <img
                                  key={uid}
                                  src={member.avatar || "/placeholder-user.jpg"}
                                  alt={member.name}
                                  className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                                />
                              ) : (
                                <div
                                  key={index}
                                  className="w-6 h-6 rounded-full border-2 border-white shadow-sm bg-gray-200 flex items-center justify-center"
                                >
                                  <span className="text-xs text-gray-500">
                                    ?
                                  </span>
                                </div>
                              );
                            })}
                          {(item.assigned_to || []).length > 3 && (
                            <div className="w-6 h-6 rounded-full border-2 border-white shadow-sm bg-gray-100 flex items-center justify-center">
                              <span className="text-xs text-gray-600">
                                +{(item.assigned_to || []).length - 3}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.datetime && (
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDateTime(item.datetime).date}
                          </span>
                        )}
                        <span
                          className={`text-xs font-medium rounded-full px-2 py-1 ${
                            item.priority === "high"
                              ? "bg-red-50 text-red-700"
                              : item.priority === "medium"
                              ? "bg-yellow-50 text-yellow-700"
                              : "bg-blue-50 text-blue-700"
                          }`}
                        >
                          {item.priority.charAt(0).toUpperCase() +
                            item.priority.slice(1)}
                        </span>
                      </div>
                    </div>

                    {/* Meta info row */}
                    <div className="flex items-center gap-4 text-xs text-gray-400 pt-1 border-t border-gray-50">
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" />
                        {Math.floor(Math.random() * 10)} Comments
                      </span>
                      <span className="flex items-center gap-1">
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path d="M10 13a5 5 0 0 1 7 7l-1 1a5 5 0 0 1-7-7m1-1a5 5 0 0 1 7-7l1 1a5 5 0 0 1-7 7" />
                        </svg>
                        {Math.floor(Math.random() * 5)} Links
                      </span>
                      <span className="flex items-center gap-1">
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                        {Math.floor(Math.random() * 3)}/
                        {Math.floor(Math.random() * 5) + 1}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Add Column Button */}
        {/* <div className="min-w-[60px] flex items-start pt-12">
          <button
            className="w-10 h-10 flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-colors"
            aria-label="Add column"
          >
            <Plus className="w-5 h-5 text-gray-400" />
          </button>
        </div> */}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Itinerary Item</DialogTitle>
            <DialogDescription>
              Update the details of this itinerary item.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Activity title"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Activity description"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Date & Time</label>
                <Input
                  type="datetime-local"
                  value={formData.datetime}
                  onChange={(e) =>
                    setFormData({ ...formData, datetime: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Type</label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPE_ICONS).map(([key, icon]) => (
                      <SelectItem key={key} value={key}>
                        <span className="flex items-center gap-2">
                          <span>{icon}</span>
                          <span className="capitalize">{key}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Location</label>
                <Input
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  placeholder="Location"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Priority</label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: "low" | "medium" | "high") =>
                    setFormData({ ...formData, priority: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateItem}>Update Item</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
