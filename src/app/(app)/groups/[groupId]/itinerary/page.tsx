"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import {
  Plus,
  Calendar,
  MoreHorizontal,
  MessageCircle,
  Users,
  ClockIcon,
  MapPin,
  AlertCircle,
} from "lucide-react";
import { Chip, Spinner } from "@heroui/react";
import { createClient } from "@/lib/supabase";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/shared/components/ui/dropdown-menu";
import { InviteTeammatesModal } from "@/features/invite/components/invite-teammember";
import { useGroupMembership } from "@/shared/hooks/useGroupMembership";
import { toast } from "sonner";

interface ItineraryItem {
  id: string;
  group_id: string;
  title: string;
  description: string | null;
  datetime: string;
  type:
    | "flight"
    | "accommodation"
    | "activity"
    | "transport"
    | "budget"
    | "other";
  status: "confirmed" | "pending" | "cancelled" | "completed";
  location: string | null;
  priority: "low" | "medium" | "high";
  notes: string | null;
  assigned_to: string[] | null;
  image_url: string | null;
  external_link: string | null;
  created_at: string | null;
  is_archived: boolean | null;
}

interface GroupMember {
  id: string;
  name: string;
  avatar: string;
  username: string;
}

// Updated columns based on database status values
const COLUMNS = [
  {
    id: "pending",
    title: "To do",
    color: "bg-orange-50 text-orange-700",
    dot: "#F59E0B",
  },
  {
    id: "confirmed",
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
] as const;

const PRIORITY_COLORS = {
  low: "bg-gray-100 text-gray-700 border-gray-300",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-300",
  high: "bg-red-100 text-red-700 border-red-300",
};

// Updated type icons based on database schema
const TYPE_ICONS = {
  flight: "✈️",
  accommodation: "🏨",
  activity: "🎯",
  transport: "🚗",
  budget: "💰",
  other: "📝",
};

const TYPE_COLORS = {
  flight: "bg-blue-100 text-blue-700 border-blue-300",
  accommodation: "bg-purple-100 text-purple-700 border-purple-300",
  activity: "bg-green-100 text-green-700 border-green-300",
  transport: "bg-indigo-100 text-indigo-700 border-indigo-300",
  budget: "bg-yellow-100 text-yellow-700 border-yellow-300",
  other: "bg-gray-100 text-gray-700 border-gray-300",
};

// Status badge mapping based on database values
const COLUMN_BADGES: Record<string, { label: string; color: string }> = {
  pending: { label: "Not Started", color: "bg-blue-50 text-blue-700" },
  confirmed: { label: "In Progress", color: "bg-purple-50 text-purple-700" },
  completed: { label: "Completed", color: "bg-green-50 text-green-700" },
  cancelled: { label: "Cancelled", color: "bg-red-50 text-red-700" },
};

// Priority badge mapping
const PRIORITY_BADGES: Record<string, string> = {
  low: "bg-[#F4F4F5] text-[#71717A]",
  medium: "bg-[#FEF3C7] text-[#B54708]",
  high: "bg-[#FEE2E2] text-[#B91C1C]",
};

// Meta info icons (SVG inline for comments, links, checklist)
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

export default function ItineraryPage() {
  const params = useParams<{ groupId: string }>();
  const router = useRouter();
  const groupId = params.groupId;

  // Check user membership status
  const {
    membershipInfo,
    loading: membershipLoading,
    error: membershipError,
    refetch: refetchMembership,
  } = useGroupMembership(groupId);

  // Debug: Log membership error and info
  console.log(
    "membershipError",
    membershipError,
    "membershipInfo",
    membershipInfo
  );

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
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isRejoining, setIsRejoining] = useState(false);

  const handleOpenInviteModal = () => setIsInviteModalOpen(true);
  const handleCloseInviteModal = () => setIsInviteModalOpen(false);

  // Handle rejoining after being removed
  const handleRejoinGroup = async () => {
    setIsRejoining(true);
    try {
      const response = await fetch(`/api/groups/${groupId}/join-request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        toast.success("Join request sent successfully");
        // Refetch membership info
        await refetchMembership();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to send join request");
      }
    } catch (err) {
      console.error("Error sending join request:", err);
      toast.error("Failed to send join request");
    } finally {
      setIsRejoining(false);
    }
  };

  // Show error toast if there's an error
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  // Handle membership errors
  useEffect(() => {
    if (membershipError) {
      if (membershipError.includes("Not a member")) {
        toast.error("You are not a member of this group");
        // Redirect to groups page after a short delay
        // setTimeout(() => {
        //   router.push("/groups");
        // }, 2000);
      } else if (membershipError.includes("Group not found")) {
        toast.error("Group not found");
        // router.push("/groups");
      } else {
        toast.error(membershipError);
      }
    }
  }, [membershipError, router]);

  // Form state for new/edit item
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    datetime: "",
    type: "other" as ItineraryItem["type"],
    location: "",
    priority: "medium" as "low" | "medium" | "high",
    notes: "",
    assigned_to: [] as string[],
    image_url: "",
    external_link: "",
  });

  useEffect(() => {
    fetchItineraryData();
    fetchGroupMembers();
  }, [params.groupId]);

  const fetchItineraryData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/groups/${params.groupId}/itinerary`);
      if (!response.ok) throw new Error("Failed to fetch itinerary");
      const data = await response.json();
      console.log("Fetched itinerary data:", data);
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
      console.log("Fetched group members:", data);
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
          status: "pending", // Default status for new items
          group_id: params.groupId,
          assigned_to: Array.isArray(formData.assigned_to)
            ? formData.assigned_to
            : [],
        }),
      });

      if (!response.ok) throw new Error("Failed to add item");

      setIsAddDialogOpen(false);
      resetForm();
      fetchItineraryData(); // Refresh data
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
            assigned_to: Array.isArray(formData.assigned_to)
              ? formData.assigned_to
              : [],
            group_id: params.groupId,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to update item");

      setIsEditDialogOpen(false);
      setEditingItem(null);
      resetForm();
      fetchItineraryData(); // Refresh data
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
      fetchItineraryData(); // Refresh data
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
            status: newStatus,
            assigned_to: Array.isArray(item.assigned_to)
              ? item.assigned_to
              : [],
            group_id: params.groupId,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to update status");
      fetchItineraryData(); // Refresh data
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
      notes: "",
      assigned_to: [],
      image_url: "",
      external_link: "",
    });
  };

  const openEditDialog = (item: ItineraryItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      description: item.description || "",
      datetime: item.datetime,
      type: item.type,
      location: item.location || "",
      priority: item.priority,
      notes: item.notes || "",
      assigned_to: item.assigned_to || [],
      image_url: item.image_url || "",
      external_link: item.external_link || "",
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
      (item.description &&
        item.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.location &&
        item.location.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === "all" || item.type === filterType;
    const matchesPriority =
      filterPriority === "all" || item.priority === filterPriority;

    return matchesSearch && matchesType && matchesPriority;
  });

  const getItemsByStatus = (status: ItineraryItem["status"]) => {
    return filteredItems.filter((item) => item.status === status);
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

  // Membership check and error handling must be before any layout rendering
  if (membershipLoading) {
    return (
      <div className="max-w-full mx-0 bg-card rounded-3xl shadow-none border border-border overflow-hidden flex items-center justify-center h-[80vh]">
        <div className="flex items-center space-x-2">
          <Spinner variant="spinner" size="sm" color="primary" />
          <span className="text-primary text-sm">Checking membership...</span>
        </div>
      </div>
    );
  }

  const isNotMember =
    (!membershipLoading &&
      membershipInfo &&
      !membershipInfo.isMember &&
      !membershipInfo.isCreator) ||
    (membershipError && membershipError.includes("Not a member"));

  const hasPendingRequest = membershipInfo?.hasPendingRequest || false;

  if (isNotMember) {
    return (
      <div className="max-w-full mx-0 bg-card rounded-3xl shadow-none border border-border overflow-hidden flex items-center justify-center h-[80vh]">
        <div className="text-center max-w-md mx-auto p-8 flex flex-col items-center justify-center">
          <h2 className="text-md font-semibold text-foreground mb-2">
            Join the group to access itinerary
          </h2>
          <p className="text-xs text-muted-foreground mb-6">
            You need to be a member of this group to view the itinerary.
          </p>
          <Button
            onClick={handleRejoinGroup}
            disabled={isRejoining}
            className={`w-full mb-2 text-xs ${hasPendingRequest ? "pointer-events-none" : ""}`}
            variant={hasPendingRequest ? "outline" : "default"}
          >
            {isRejoining ? (
              <>
                <Spinner
                  variant="spinner"
                  size="sm"
                  className="mr-1"
                  classNames={{ spinnerBars: "bg-white" }}
                />
                Requesting...
              </>
            ) : hasPendingRequest ? (
              "Request Pending"
            ) : (
              "Request to Join Group"
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/groups")}
            className="w-full text-xs"
          >
            Back to Groups
          </Button>
        </div>
      </div>
    );
  }

  if (membershipError && membershipError.includes("Group not found")) {
    return (
      <div className="max-w-full mx-0 bg-card rounded-3xl shadow-none border border-border overflow-hidden flex items-center justify-center h-[80vh]">
        <div className="text-center max-w-md mx-auto p-6 flex flex-col items-center justify-center">
          <div className="flex items-center justify-center mb-2">
            <AlertCircle className="h-7 w-7 text-muted-foreground" />
          </div>
          <h2 className="text-md font-semibold text-foreground mb-2">
            Group Not Found
          </h2>
          <p className="text-xs text-muted-foreground mb-6">
            The group you&apos;re looking for doesn&apos;t exist or has been
            deleted.
          </p>
          <Button
            variant="outline"
            onClick={() => router.push("/groups")}
            className="w-full text-xs"
          >
            Back to Groups
          </Button>
        </div>
      </div>
    );
  }

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

  return (
    <div className="space-y-6 bg-transparent min-h-screen p-2">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-foreground">
            Itinerary Board
          </h1>
          <p className="text-sm text-muted-foreground">
            Plan and organize your group&apos;s travel activities
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
                  className="w-8 h-8 rounded-full shadow-sm"
                  title={member.name}
                />
              ))}
              {Array.isArray(groupMembers) && groupMembers.length > 4 && (
                <div className="w-8 h-8 rounded-full border-border border-3 shadow-sm bg-card flex items-center justify-center">
                  <span className="text-xs font-medium text-muted-foreground">
                    +{groupMembers.length - 4}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Desktop actions (md+) */}
          <div className="hidden md:flex items-center gap-2">
            <Button
              className="bg-violet-600 hover:bg-violet-700 text-primary-foreground px-4 py-2 rounded-lg font-medium"
              onClick={handleOpenInviteModal}
            >
              <Users className="w-4 h-4 mr-2" />
              <span className="text-sm">Invite Member</span>
            </Button>
            <Button
              variant="outline"
              className="border-border text-foreground hover:bg-gray-200 px-4 py-2 rounded-lg font-medium"
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
            <Button
              className="flex items-center rounded-lg gap-2 bg-primary hover:bg-primary-hover"
              onClick={() => setIsAddDialogOpen(true)}
            >
              <Plus className="h-4 w-4" />
              <span className="text-sm">Add Item</span>
            </Button>
          </div>
          {/* Mobile dropdown actions (sm) */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" aria-label="More actions">
                  <MoreHorizontal className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleOpenInviteModal}>
                  <Users className="w-4 h-4 mr-2" />
                  Invite Member
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
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
                  Share
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Board Columns */}
      <div className="flex flex-col md:grid md:grid-cols-2 xl:flex xl:flex-row gap-4 pb-4">
        {COLUMNS.map((column) => {
          const filteredItems = itineraryItems.filter(
            (item) => item.status === column.id
          );

          return (
            <div
              key={column.id}
              className="w-full overflow-y-clip bg-card rounded-lg border border-border shadow-sm flex flex-col"
              onDragOver={handleDragOver}
              onDrop={(e) =>
                handleDrop(e, column.id as ItineraryItem["status"])
              }
            >
              {/* Column Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: column.dot }}
                  ></span>
                  <span className="font-medium text-foreground text-sm">
                    {column.title}
                  </span>
                  <span className="ml-1 text-xs bg-gray-100 text-muted-foreground rounded-full px-2 py-0.5 min-w-[20px] text-center">
                    {filteredItems.length}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 transition-colors"
                    onClick={() => setIsAddDialogOpen(true)}
                    aria-label="Add task"
                  >
                    <Plus className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button
                    className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 transition-colors"
                    aria-label="Column actions"
                  >
                    <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </div>

              {/* Tasks */}
              <div className="flex-1 flex flex-col gap-3 p-4">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-card border border-border rounded-lg shadow-sm p-4 flex flex-col gap-3 relative transition-shadow cursor-pointer"
                    draggable
                    onDragStart={(e) => handleDragStart(e, item)}
                    onClick={() => openEditDialog(item)}
                  >
                    {/* Status badge */}
                    {(() => {
                      const badge = COLUMN_BADGES[item.status];
                      return (
                        <div className="flex gap-1">
                          <Chip
                            className={`inline-flex items-center text-xs font-medium rounded-full px-2 py-1 ${
                              badge?.color || "bg-gray-100 text-foreground"
                            }`}
                          >
                            <span className="font-semibold">
                              {badge?.label || item.status}
                            </span>
                          </Chip>
                          <Chip
                            className={`inline-flex items-center text-xs font-medium rounded-full px-2 py-1 ${
                              item.priority === "high"
                                ? "bg-red-50 text-red-700"
                                : item.priority === "medium"
                                  ? "bg-yellow-50 text-yellow-700"
                                  : "bg-blue-50 text-blue-700"
                            }`}
                          >
                            <span className="font-semibold">
                              {item.priority.charAt(0).toUpperCase() +
                                item.priority.slice(1)}
                            </span>
                          </Chip>
                        </div>
                      );
                    })()}

                    {/* Title & Description */}
                    <div className="space-y-1">
                      <h3 className="font-medium text-foreground text-sm leading-tight">
                        {item.title}
                      </h3>
                      {item.description && (
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                          {item.description}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-4 text-muted-foreground text-xs">
                        {/* Date */}
                        {item.datetime && (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3 h-3" aria-label="Date" />
                            <div className="flex flex-col leading-tight">
                              <span>
                                {new Date(item.datetime).toLocaleDateString(
                                  "en-US",
                                  {
                                    weekday: "short",
                                    month: "short",
                                    day: "2-digit",
                                  }
                                )}
                              </span>
                            </div>
                          </div>
                        )}
                        {/* Time */}
                        {item.datetime && (
                          <div className="flex items-center gap-2">
                            <ClockIcon className="h-3 w-3" />
                            {/* <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              viewBox="0 0 24 24"
                              aria-label="Time"
                            >
                              <circle cx="12" cy="12" r="10" />
                              <path d="M12 6v6l4 2" />
                            </svg> */}
                            <div className="flex flex-col leading-tight">
                              <span>
                                {new Date(item.datetime).toLocaleTimeString(
                                  "en-US",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: true,
                                  }
                                )}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                      {/* Location */}
                      <div className="flex items-center gap-4 text-muted-foreground text-xs">
                        {item.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3" />
                            <div className="flex flex-col leading-tight">
                              <span className="text-xs">{item.location}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Assignees and Due Date */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          Assignees ({item.assigned_to?.length || 0}):
                        </span>
                        <div className="flex -space-x-1">
                          {(item.assigned_to || [])
                            .slice(0, 3)
                            .map((uid, index) => {
                              const member = groupMembers.find(
                                (m) => m.id === uid
                              );
                              console.log(`Assignee ${index}:`, {
                                uid,
                                member,
                                groupMembers: groupMembers.length,
                              });
                              return member ? (
                                <img
                                  key={uid}
                                  src={member.avatar || "/placeholder-user.jpg"}
                                  alt={member.name}
                                  className="w-6 h-6 rounded-full shadow-sm"
                                  title={member.name}
                                />
                              ) : (
                                <div
                                  key={index}
                                  className="w-6 h-6 rounded-full shadow-sm bg-gray-200 flex items-center justify-center"
                                  title={`Unknown user: ${uid}`}
                                >
                                  <span className="text-xs text-muted-foreground">
                                    ?
                                  </span>
                                </div>
                              );
                            })}
                          {(item.assigned_to || []).length > 3 && (
                            <div className="w-6 h-6 rounded-full  shadow-sm bg-gray-100 flex items-center justify-center">
                              <span className="text-xs text-muted-foreground">
                                +{(item.assigned_to || []).length - 3}
                              </span>
                            </div>
                          )}
                          {/* Show message if no assignees */}
                          {(item.assigned_to || []).length === 0 && (
                            <span className="text-xs text-muted-foreground italic">
                              No assignees
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Meta info row */}
                    {/* <div className="flex items-center gap-4 text-xs text-gray-400 pt-1 border-t border-gray-50">
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
                    </div> */}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[800px]">
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
                  onValueChange={(value: ItineraryItem["type"]) =>
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
            <div>
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Additional notes"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Image URL</label>
                <Input
                  value={formData.image_url}
                  onChange={(e) =>
                    setFormData({ ...formData, image_url: e.target.value })
                  }
                  placeholder="Image URL"
                />
              </div>
              <div>
                <label className="text-sm font-medium">External Link</label>
                <Input
                  value={formData.external_link}
                  onChange={(e) =>
                    setFormData({ ...formData, external_link: e.target.value })
                  }
                  placeholder="External link"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Assign To</label>
              <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-2">
                {groupMembers.map((member) => (
                  <label
                    key={member.id}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.assigned_to.includes(member.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            assigned_to: [...formData.assigned_to, member.id],
                          });
                        } else {
                          setFormData({
                            ...formData,
                            assigned_to: formData.assigned_to.filter(
                              (id) => id !== member.id
                            ),
                          });
                        }
                      }}
                      className="rounded"
                    />
                    <img
                      src={member.avatar || "/placeholder-user.jpg"}
                      alt={member.name}
                      className="w-6 h-6 rounded-full"
                    />
                    <span className="text-sm">{member.name}</span>
                  </label>
                ))}
                {Array.isArray(groupMembers) && groupMembers.length === 0 && (
                  <p className="text-sm text-muted-foreground italic">
                    No group members available
                  </p>
                )}
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

      {/* Add Item Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogTrigger asChild>
          {/* Hidden trigger, open via setIsAddDialogOpen */}
          <div style={{ display: "none" }} />
        </DialogTrigger>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Add Itinerary Item</DialogTitle>
            <DialogDescription>
              Create a new activity or event for your group&apos;s itinerary.
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
                  setFormData({
                    ...formData,
                    description: e.target.value,
                  })
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
                  onValueChange={(value: ItineraryItem["type"]) =>
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
            <div>
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Additional notes"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Image URL</label>
                <Input
                  value={formData.image_url}
                  onChange={(e) =>
                    setFormData({ ...formData, image_url: e.target.value })
                  }
                  placeholder="Image URL"
                />
              </div>
              <div>
                <label className="text-sm font-medium">External Link</label>
                <Input
                  value={formData.external_link}
                  onChange={(e) =>
                    setFormData({ ...formData, external_link: e.target.value })
                  }
                  placeholder="External link"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Assign To</label>
              <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-2">
                {groupMembers.map((member) => (
                  <label
                    key={member.id}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.assigned_to.includes(member.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            assigned_to: [...formData.assigned_to, member.id],
                          });
                        } else {
                          setFormData({
                            ...formData,
                            assigned_to: formData.assigned_to.filter(
                              (id) => id !== member.id
                            ),
                          });
                        }
                      }}
                      className="rounded"
                    />
                    <img
                      src={member.avatar || "/placeholder-user.jpg"}
                      alt={member.name}
                      className="w-6 h-6 rounded-full"
                    />
                    <span className="text-sm">{member.name}</span>
                  </label>
                ))}
                {Array.isArray(groupMembers) && groupMembers.length === 0 && (
                  <p className="text-sm text-muted-foreground italic">
                    No group members available
                  </p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddItem}>Add Item</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <InviteTeammatesModal
        open={isInviteModalOpen}
        onOpenChange={setIsInviteModalOpen}
        groupId={groupId}
      />
    </div>
  );
}
