"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
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
import { Label } from "@/shared/components/ui/label";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
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
  Trash2,
  Pencil,
} from "lucide-react";
import { Chip, Spinner } from "@heroui/react";
import { DateTimePicker } from "@/shared/components/ui/time-picker";
import { cn } from "@/shared/utils/utils";
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
    color: "bg-yellow-50 text-yellow-700",
    dot: "#F59E0B",
  },
  {
    id: "confirmed",
    title: "In Progress",
    color: "bg-blue-50 text-blue-700",
    dot: "#007aff",
  },
  {
    id: "completed",
    title: "Done",
    color: "bg-purple-50 text-purple-700",
    dot: "#34c759",
  },
  {
    id: "cancelled",
    title: "Cancelled",
    color: "bg-red-50 text-red-700",
    dot: "#f31260",
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
  pending: { label: "Not Started", color: "bg-yellow-50 text-yellow-700" },
  confirmed: { label: "In Progress", color: "bg-blue-50 text-blue-700" },
  completed: { label: "Completed", color: "bg-green-50 text-green-700" },
  cancelled: { label: "Cancelled", color: "bg-red-50 text-red-700" },
};

// Get initials for avatar fallback (e.g. "Navneet Prajapati" -> "NP")
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

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
  const [groupInfo, setGroupInfo] = useState<{
    status?: "active" | "pending" | "removed";
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);
  const [editingItem, setEditingItem] = useState<ItineraryItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<ItineraryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
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

  // Ref to always read latest formData at submit time (avoids stale closure in dialogs)
  const formDataRef = useRef(formData);
  formDataRef.current = formData;

  useEffect(() => {
    fetchGroupInfo();
    fetchItineraryData();
    fetchGroupMembers();
  }, [params.groupId]);

  const fetchGroupInfo = async () => {
    try {
      const response = await fetch(`/api/groups/${params.groupId}`);
      if (!response.ok) throw new Error("Failed to fetch group info");
      const data = await response.json();
      setGroupInfo(data);
    } catch (err) {
      console.error("Failed to fetch group info:", err);
    }
  };

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
    const latest = formDataRef.current;
    const title = latest.title?.trim();
    const datetime = latest.datetime?.trim();
    if (!title) {
      toast.error("Please enter a title.");
      return;
    }
    if (!datetime || datetime.length < 16) {
      toast.error("Please select a date and time.");
      return;
    }
    setIsSubmittingAdd(true);
    try {
      const response = await fetch(`/api/groups/${params.groupId}/itinerary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...latest,
          title,
          datetime,
          status: "pending",
          group_id: params.groupId,
          assigned_to: Array.isArray(latest.assigned_to)
            ? latest.assigned_to
            : [],
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Failed to add item");
      }

      setIsAddDialogOpen(false);
      resetForm();
      fetchItineraryData();
      toast.success("Item added successfully.");
    } catch (err) {
      toast.error((err as Error).message);
      setError((err as Error).message);
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  const handleUpdateItem = async () => {
    if (!editingItem) return;

    const latest = formDataRef.current;
    const title = latest.title?.trim();
    const datetime = latest.datetime?.trim();
    if (!title) {
      toast.error("Please enter a title.");
      return;
    }
    if (!datetime || datetime.length < 16) {
      toast.error("Please select a date and time.");
      return;
    }
    setIsSubmittingEdit(true);
    try {
      const response = await fetch(
        `/api/groups/${params.groupId}/itinerary/${editingItem.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...latest,
            title,
            datetime,
            assigned_to: Array.isArray(latest.assigned_to)
              ? latest.assigned_to
              : [],
            group_id: params.groupId,
          }),
        }
      );

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Failed to update item");
      }

      setIsEditDialogOpen(false);
      setEditingItem(null);
      resetForm();
      fetchItineraryData();
      toast.success("Item updated successfully.");
    } catch (err) {
      toast.error((err as Error).message);
      setError((err as Error).message);
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    setIsDeleting(true);
    try {
      const response = await fetch(
        `/api/groups/${params.groupId}/itinerary/${itemId}`,
        { method: "DELETE" }
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Failed to delete item");

      setItemToDelete(null);
      if (editingItem?.id === itemId) {
        setIsEditDialogOpen(false);
        setEditingItem(null);
        resetForm();
      }
      fetchItineraryData();
      toast.success("Item deleted.");
    } catch (err) {
      toast.error((err as Error).message);
      setError((err as Error).message);
    } finally {
      setIsDeleting(false);
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

  const openAddDialog = () => {
    resetForm();
    setIsAddDialogOpen(true);
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
      <div className="max-w-full mx-0 bg-card rounded-3xl shadow-none border border-border overflow-hidden flex items-center justify-center h-[90vh]">
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

  // Check if group is pending - show "under review" message for all users (including creators)
  const isPending = groupInfo?.status === "pending";

  if (isPending) {
    return (
      <div className="max-w-full mx-0 bg-card rounded-3xl shadow-none border border-border overflow-hidden flex items-center justify-center h-[80vh]">
        <div className="text-center max-w-md mx-auto p-6 flex flex-col items-center justify-center">
          <div className="flex items-center justify-center mb-2">
            <AlertCircle className="h-7 w-7 text-muted-foreground" />
          </div>
          <h2 className="text-md font-semibold text-foreground mb-2">
            Group Under Review
          </h2>
          <p className="text-xs text-muted-foreground mb-6">
            This group is currently pending admin approval and is not available
            for viewing or interaction.
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

  // if (loading) {
  //   return (
  //     <div className="flex items-center justify-center h-[80vh]">
  //       <Spinner variant="spinner" size="md" color="primary" />
  //     </div>
  //   );
  // }

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
          {/* <div className="flex items-center gap-3">
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
          </div> */}

          {/* Desktop actions (md+) */}
          <div className="hidden md:flex items-center gap-2">
            <Button
              className="bg-primary hover:bg-primary-hover text-primary-foreground px-4 py-2 rounded-lg font-medium"
              onClick={handleOpenInviteModal}
            >
              <Users className="w-4 h-4 mr-2" />
              <span className="text-sm">Invite Member</span>
            </Button>
            <Button
              className="flex items-center rounded-lg gap-2 bg-primary hover:bg-primary-hover"
              onClick={openAddDialog}
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
                <DropdownMenuItem onClick={openAddDialog}>
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
                    onClick={openAddDialog}
                    aria-label="Add task"
                  >
                    <Plus className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </div>

              {/* Tasks */}
              <div className="flex-1 flex flex-col gap-3 p-4">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-card border border-border rounded-lg shadow-sm p-4 flex flex-col gap-3 relative transition-shadow cursor-pointer group"
                    draggable
                    onDragStart={(e) => handleDragStart(e, item)}
                    onClick={() => openEditDialog(item)}
                  >
                    {/* Card actions: Edit & Delete */}
                    <div
                      className="absolute top-4 right-4 z-10 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                        <button
                    className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 transition-colors"
                    aria-label="Column actions"
                  >
                    <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                  </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="p-4 py-2 min-w-[160px] rounded-2xl shadow-sm backdrop-blur-2xl bg-white/70 transition-all duration-300 ease-in-out border-border mr-4">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditDialog(item);
                            }}

                            className="text-foreground font-medium hover:cursor-pointer focus:bg-transparent focus:text-foreground focus-within:!border-none focus-within:!outline-none"
                          >
                            <Pencil className="w-4 h-4 mr-0" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive focus:bg-destructive/10 font-medium hover:cursor-pointer focus:bg-transparent focus-within:!border-none focus-within:!outline-none"
                            onClick={(e) => {
                              e.stopPropagation();
                              setItemToDelete(item);
                            }}
                            
                          >
                            <Trash2 className="w-4 h-4 mr-0 text-destructive" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
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
        <DialogContent className="flex flex-col w-[calc(100%-2rem)] max-w-full sm:max-w-[min(800px,calc(100vw-2rem))] max-h-[90dvh] rounded-2xl border-border p-0 gap-0 shadow-xl overflow-hidden">
          <DialogHeader className="shrink-0 px-4 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-border space-y-1 bg-background text-left">
            <DialogTitle className="text-md font-semibold text-foreground">
              Edit Itinerary Item
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Update the details of this itinerary item.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar px-4 sm:px-6 py-4 sm:py-5 space-y-5 sm:space-y-6">
            <div className="space-y-2">
              <Label htmlFor="edit-title" className="text-foreground">
                Title
              </Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                onFocus={(e) => {
                  // Prevent full text selection when dialog opens and this field gets focus
                  setTimeout(() => e.target.setSelectionRange(e.target.value.length, e.target.value.length), 0);
                }}
                placeholder="Activity title"
                className="rounded-lg border-border h-10 sm:h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description" className="text-foreground">
                Description
              </Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Activity description"
                rows={3}
                className="rounded-lg border-border resize-none min-h-[60px]"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div className="space-y-2 sm:col-span-2">
                <Label className="text-foreground">Date & Time</Label>
                <DateTimePicker
                  value={formData.datetime}
                  onChange={(v) => setFormData((prev) => ({ ...prev, datetime: v }))}
                  placeholder="Select date and time"
                  variant="compact"
                  className="w-full"
                />
              </div>
              {/* <div className="space-y-2">
                <Label className="text-foreground">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: ItineraryItem["type"]) =>
                    setFormData((prev) => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger className="rounded-lg border-border h-10 sm:h-11">
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
              </div> */}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div className="space-y-2">
                <Label htmlFor="edit-location" className="text-foreground">
                  Location
                </Label>
                <Input
                  id="edit-location"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, location: e.target.value }))
                  }
                  placeholder="Location"
                  className="rounded-lg border-border h-[2.5rem] sm:h-11 min-h-[2.5rem] sm:min-h-11 w-full"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: "low" | "medium" | "high") =>
                    setFormData((prev) => ({ ...prev, priority: value }))
                  }
                >
                  <SelectTrigger className="rounded-lg border-border h-[2.5rem] sm:h-11 min-h-[2.5rem] sm:min-h-11 w-full">
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
            <div className="space-y-2">
              <Label htmlFor="edit-notes" className="text-foreground">
                Notes
              </Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Additional notes"
                rows={3}
                className="rounded-lg border-border resize-none min-h-[60px]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Assign To</Label>
              <div className="rounded-lg border border-border bg-background max-h-44 sm:max-h-48 overflow-y-auto overflow-x-hidden p-1.5 space-y-0.5">
                {groupMembers.map((member) => {
                  const isChecked = formData.assigned_to.includes(member.id);
                  return (
                    <label
                      key={member.id}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-colors outline-none",
                        "hover:bg-muted/60 active:bg-muted/80",
                        isChecked && "bg-primary/5 hover:bg-primary/10"
                      )}
                      onClick={(e) => {
                        e.preventDefault();
                        if (isChecked) {
                          setFormData((prev) => ({
                            ...prev,
                            assigned_to: prev.assigned_to.filter((id) => id !== member.id),
                          }));
                        } else {
                          setFormData((prev) => ({
                            ...prev,
                            assigned_to: [...prev.assigned_to, member.id],
                          }));
                        }
                      }}
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData((prev) => ({
                              ...prev,
                              assigned_to: [...prev.assigned_to, member.id],
                            }));
                          } else {
                            setFormData((prev) => ({
                              ...prev,
                              assigned_to: prev.assigned_to.filter((id) => id !== member.id),
                            }));
                          }
                        }}
                        className="rounded border-border pointer-events-none shrink-0"
                      />
                      <Avatar className="h-8 w-8 shrink-0 border border-border">
                        <AvatarImage
                          src={member.avatar || undefined}
                          alt={member.name}
                          className="object-cover"
                        />
                        <AvatarFallback className="bg-muted text-muted-foreground text-xs font-medium">
                          {getInitials(member.name || "Unknown")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium text-foreground truncate min-w-0">
                        {member.name || "Unknown"}
                      </span>
                    </label>
                  );
                })}
                {Array.isArray(groupMembers) && groupMembers.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Users className="h-8 w-8 text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No group members available
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="shrink-0 px-4 sm:px-6 py-4 sm:py-5 border-t border-border gap-2 flex-row flex-wrap bg-background sm:justify-between">
            <div className="flex gap-2 order-1 sm:order-2 ml-auto">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              className="rounded-lg min-w-[80px]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateItem}
              disabled={isSubmittingEdit}
              className="rounded-lg min-w-[100px] bg-primary hover:bg-primary/90 text-primary-foreground inline-flex items-center gap-2"
            >
              {isSubmittingEdit ? (
                <Spinner
                  variant="spinner"
                  size="sm"
                  classNames={{ spinnerBars: "bg-white" }}
                />
              ) : null}
              {isSubmittingEdit ? "Updating..." : "Update Item"}
            </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Item Dialog - same UI as Edit Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogTrigger asChild>
          <div className="hidden" aria-hidden />
        </DialogTrigger>
        <DialogContent className="flex flex-col w-[calc(100%-2rem)] max-w-full sm:max-w-[min(800px,calc(100vw-2rem))] max-h-[90dvh] rounded-2xl border-border p-0 gap-0 shadow-xl overflow-hidden">
          <DialogHeader className="shrink-0 px-4 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-border space-y-1 bg-background text-left">
            <DialogTitle className="text-md font-semibold text-foreground">
              Add Itinerary Item
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Create a new activity or event for your group&apos;s itinerary.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar px-4 sm:px-6 py-4 sm:py-5 space-y-5 sm:space-y-6">
            <div className="space-y-2">
              <Label htmlFor="add-title" className="text-foreground">
                Title
              </Label>
              <Input
                id="add-title"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Activity title"
                className="rounded-lg border-border h-10 sm:h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-description" className="text-foreground">
                Description
              </Label>
              <Textarea
                id="add-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Activity description"
                rows={3}
                className="rounded-lg border-border resize-none min-h-[60px]"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div className="space-y-2 sm:col-span-2">
                <Label className="text-foreground">Date & Time</Label>
                <DateTimePicker
                  value={formData.datetime}
                  onChange={(v) => setFormData((prev) => ({ ...prev, datetime: v }))}
                  placeholder="Select date and time"
                  variant="compact"
                  className="w-full"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div className="space-y-2">
                <Label htmlFor="add-location" className="text-foreground">
                  Location
                </Label>
                <Input
                  id="add-location"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, location: e.target.value }))
                  }
                  placeholder="Location"
                  className="rounded-lg border-border h-[2.5rem] sm:h-11 min-h-[2.5rem] sm:min-h-11 w-full"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: "low" | "medium" | "high") =>
                    setFormData((prev) => ({ ...prev, priority: value }))
                  }
                >
                  <SelectTrigger className="rounded-lg border-border h-[2.5rem] sm:h-11 min-h-[2.5rem] sm:min-h-11 w-full">
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
            <div className="space-y-2">
              <Label htmlFor="add-notes" className="text-foreground">
                Notes
              </Label>
              <Textarea
                id="add-notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Additional notes"
                rows={3}
                className="rounded-lg border-border resize-none min-h-[60px]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Assign To</Label>
              <div className="rounded-lg border border-border bg-background max-h-44 sm:max-h-48 overflow-y-auto overflow-x-hidden p-1.5 space-y-0.5">
                {groupMembers.map((member) => {
                  const isChecked = formData.assigned_to.includes(member.id);
                  return (
                    <label
                      key={member.id}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-colors outline-none",
                        "hover:bg-muted/60 active:bg-muted/80",
                        isChecked && "bg-primary/5 hover:bg-primary/10"
                      )}
                      onClick={(e) => {
                        e.preventDefault();
                        if (isChecked) {
                          setFormData((prev) => ({
                            ...prev,
                            assigned_to: prev.assigned_to.filter((id) => id !== member.id),
                          }));
                        } else {
                          setFormData((prev) => ({
                            ...prev,
                            assigned_to: [...prev.assigned_to, member.id],
                          }));
                        }
                      }}
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData((prev) => ({
                              ...prev,
                              assigned_to: [...prev.assigned_to, member.id],
                            }));
                          } else {
                            setFormData((prev) => ({
                              ...prev,
                              assigned_to: prev.assigned_to.filter((id) => id !== member.id),
                            }));
                          }
                        }}
                        className="rounded border-border pointer-events-none shrink-0"
                      />
                      <Avatar className="h-8 w-8 shrink-0 border border-border">
                        <AvatarImage
                          src={member.avatar || undefined}
                          alt={member.name}
                          className="object-cover"
                        />
                        <AvatarFallback className="bg-muted text-muted-foreground text-xs font-medium">
                          {getInitials(member.name || "Unknown")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium text-foreground truncate min-w-0">
                        {member.name || "Unknown"}
                      </span>
                    </label>
                  );
                })}
                {Array.isArray(groupMembers) && groupMembers.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Users className="h-8 w-8 text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No group members available
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="shrink-0 px-4 sm:px-6 py-4 sm:py-5 border-t border-border gap-2 flex-row flex-wrap bg-background">
          <div className="flex gap-2 order-1 sm:order-2 ml-auto">
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
              className="rounded-lg order-2 sm:order-1 min-w-[80px]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddItem}
              disabled={isSubmittingAdd}
              className="rounded-lg order-1 sm:order-2 min-w-[100px] bg-primary hover:bg-primary/90 text-primary-foreground inline-flex items-center gap-2"
            >
              {isSubmittingAdd ? (
                <Spinner
                  variant="spinner"
                  size="sm"
                  classNames={{ spinnerBars: "bg-white" }}
                />
              ) : null}
              {isSubmittingAdd ? "Adding..." : "Add Item"}
            </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog
        open={itemToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setItemToDelete(null);
        }}
      >
        <DialogContent className="flex flex-col w-[calc(100%-2rem)] max-w-[min(400px,calc(100vw-2rem))] rounded-2xl border border-border p-0 gap-0 shadow-xl overflow-hidden">
          <DialogHeader className="shrink-0 px-4 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-border space-y-1 bg-background text-left">
            <DialogTitle className="text-md font-semibold text-foreground">
              Delete itinerary item?
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {itemToDelete ? (
                <>
                  Are you sure you want to delete &quot;{itemToDelete.title}&quot;?
                  This action cannot be undone.
                </>
              ) : (
                "This action cannot be undone."
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="shrink-0 px-4 sm:px-6 py-4 sm:py-5 border-t border-border gap-2 flex-row flex-wrap bg-background justify-end">
          <div className="flex gap-2 order-1 sm:order-2 ml-auto">
            <Button
              variant="outline"
              onClick={() => setItemToDelete(null)}
              disabled={isDeleting}
              className="rounded-lg min-w-[80px] border-border text-muted-foreground hover:text-foreground focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-border"
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (itemToDelete) await handleDeleteItem(itemToDelete.id);
              }}
              disabled={isDeleting}
              className="rounded-lg min-w-[80px] bg-destructive text-primary-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
            >
              {isDeleting ? (
                <>
                  <Spinner
                    variant="spinner"
                    size="sm"
                    classNames={{ spinnerBars: "bg-white" }}
                  />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
            </div>
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
