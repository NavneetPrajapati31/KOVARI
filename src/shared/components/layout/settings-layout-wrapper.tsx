"use client";
import React, { useCallback, memo, useState } from "react";
import SettingsSidebar from "@/shared/components/layout/settings-sidebar";
import { useSettingsTabs } from "@/features/groups/hooks/use-settings-tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/shared/components/ui/button";
import { Spinner } from "@heroui/react";
import { AlertCircle, ChevronLeft } from "lucide-react";
import { useGroupMembership } from "@/shared/hooks/useGroupMembership";
import { toast } from "sonner";
import { useIsMobile } from "@/shared/hooks/use-mobile";

// Import section components
import { BasicInfoSection } from "@/features/groups/components/edit-group-sections/basic-info-section";
import { TravelDetailsSection } from "@/features/groups/components/edit-group-sections/travel-details-section";
import { PrivacySafetySection } from "@/features/groups/components/edit-group-sections/privacy-safety-section";
// Import other pages
import MembersPage from "@/app/(app)/groups/[groupId]/settings/members/page";
import RequestPage from "@/app/(app)/groups/[groupId]/settings/requests/page";
import DangerPage from "@/app/(app)/groups/[groupId]/settings/danger/page";

const ISO_DATE_REGEX = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;

// Enhanced schema for travel group editing
const editGroupSchema = z
  .object({
    // Basic Information
    groupName: z
      .string()
      .min(3, "Group name must be at least 3 characters")
      .max(50, "Group name must be less than 50 characters"),
    description: z
      .string()
      .max(500, "Description must be less than 500 characters")
      .optional(),
    destination: z.string().min(1, "Destination is required"),
    destinationDetails: z.any().optional(),
    coverImage: z.string().optional().nullable(),

    // Travel Details
    budget: z
      .number({ invalid_type_error: "Budget must be a number" })
      .min(0, "Budget must be positive"),
    startDate: z
      .string()
      .min(1, "Start date is required")
      .regex(ISO_DATE_REGEX, "Invalid start date"),
    endDate: z
      .string()
      .min(1, "End date is required")
      .regex(ISO_DATE_REGEX, "Invalid end date"),

    // Privacy & Visibility
    visibility: z.enum(["public", "private", "invite-only"]),
    strictlyNonSmoking: z.boolean(),
    strictlyNonDrinking: z.boolean(),
  })
  .refine(
    (data) => {
      if (
        !ISO_DATE_REGEX.test(data.startDate) ||
        !ISO_DATE_REGEX.test(data.endDate)
      ) {
        return true;
      }
      return data.startDate < data.endDate;
    },
    {
      message: "End date must be after start date",
      path: ["endDate"],
    }
  );

type EditGroupForm = z.infer<typeof editGroupSchema>;

const SECTION_COMPONENTS = {
  basic: BasicInfoSection,
  travel: TravelDetailsSection,
  privacy: PrivacySafetySection,
} as const;

const PAGE_COMPONENTS = {
  members: MembersPage,
  requests: RequestPage,
  delete: DangerPage,
} as const;

// Default form values
const getDefaultFormValues = (): EditGroupForm => ({
  groupName: "",
  description: "",
  destination: "",
  destinationDetails: null,
  coverImage: null,
  budget: 0,
  startDate: "",
  endDate: "",
  visibility: "public",
  strictlyNonSmoking: false,
  strictlyNonDrinking: false,
});

// Memoized section content component
const SectionContent = memo(
  ({
    activeTab,
    groupId,
    groupData,
    onGroupUpdate,
  }: {
    activeTab: string | null;
    groupId: string | undefined;
    groupData: {
      name?: string;
      destination?: string;
      destination_details?: any;
      cover_image?: string | null;
      description?: string | null;
      budget?: number;
      start_date?: string;
      end_date?: string;
      is_public?: boolean | null;
      non_smokers?: boolean | null;
      non_drinkers?: boolean | null;
    } | null;
    onGroupUpdate?: (data: Record<string, unknown>) => void;
  }) => {
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    // Initialize form for edit sections
    const form = useForm<EditGroupForm>({
      resolver: zodResolver(editGroupSchema),
      defaultValues: getDefaultFormValues(),
    });

    // Populate form when group data loads
    React.useEffect(() => {
      if (groupData) {
        form.reset({
          ...getDefaultFormValues(),
          groupName: groupData.name ?? "",
          description: groupData.description ?? "",
          destination: groupData.destination ?? "",
          destinationDetails: groupData.destination_details ?? null,
          coverImage: groupData.cover_image ?? null,
          budget: groupData.budget ?? 10000,
          startDate: groupData.start_date ?? "",
          endDate: groupData.end_date ?? "",
          visibility: groupData.is_public === false ? "private" : "public",
          strictlyNonSmoking: groupData.non_smokers ?? false,
          strictlyNonDrinking: groupData.non_drinkers ?? false,
        } as EditGroupForm);
      }
    }, [groupData, form]);

    const handleSectionSubmit = React.useCallback(
      async (sectionId: string) => {
        if (!groupId) return;
        setIsSubmitting(true);
        try {
          if (sectionId === "travel") {
            const isValid = await form.trigger(["startDate", "endDate"]);
            if (!isValid) {
              toast.error("Please check your travel dates");
              return;
            }
          }

          const values = form.getValues();
          if (sectionId === "basic") {
            const res = await fetch(`/api/groups/${groupId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: values.groupName,
                destination: values.destination,
                destination_details: values.destinationDetails,
                description: values.description ?? "",
                cover_image: values.coverImage ?? null,
              }),
            });
            const data = await res.json();
            if (!res.ok) {
              throw new Error(data.error || "Failed to update");
            }
            toast.success("Basic info updated successfully");
            onGroupUpdate?.(data);
          } else if (sectionId === "travel") {
            const res = await fetch(`/api/groups/${groupId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                start_date: values.startDate,
                end_date: values.endDate,
                budget: values.budget,
              }),
            });

            const data = await res.json();
            if (!res.ok) {
              throw new Error(data.error || "Failed to update");
            }

            toast.success("Travel details updated successfully");
            onGroupUpdate?.(data);
          } else if (sectionId === "privacy") {
            const isValid = await form.trigger(["visibility"]);
            if (!isValid) {
              toast.error("Please check your privacy setting");
              return;
            }

            const res = await fetch(`/api/groups/${groupId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                is_public: values.visibility === "public",
                non_smokers: values.strictlyNonSmoking,
                non_drinkers: values.strictlyNonDrinking,
              }),
            });

            const data = await res.json();
            if (!res.ok) {
              throw new Error(data.error || "Failed to update");
            }

            toast.success("Privacy updated successfully");
            onGroupUpdate?.(data);
          } else {
            // Travel/Privacy sections - placeholder for future API
            await new Promise((resolve) => setTimeout(resolve, 500));
            toast.success(`${sectionId} section updated`);
          }
        } catch (error) {
          console.error(`Error updating ${sectionId}:`, error);
          toast.error(
            error instanceof Error ? error.message : "Failed to update"
          );
        } finally {
          setIsSubmitting(false);
        }
      },
      [groupId, form, onGroupUpdate]
    );

    // Check if it's an edit section
    if (activeTab && activeTab in SECTION_COMPONENTS) {
      const SectionComponent =
        SECTION_COMPONENTS[activeTab as keyof typeof SECTION_COMPONENTS];
      return (
        <div className="w-full h-full p-4">
          <SectionComponent
            form={form}
            onSubmit={handleSectionSubmit}
            isSubmitting={isSubmitting}
          />
        </div>
      );
    }

    // Check if it's a page component
    if (activeTab && activeTab in PAGE_COMPONENTS) {
      const PageComponent =
        PAGE_COMPONENTS[activeTab as keyof typeof PAGE_COMPONENTS];
      return (
        <div className="w-full h-full">
          <PageComponent />
        </div>
      );
    }

    // Default fallback
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-muted-foreground">Select a section to get started</p>
      </div>
    );
  }
);

SectionContent.displayName = "SectionContent";

export default function LayoutWrapper() {
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

  const [isRejoining, setIsRejoining] = useState(false);
  const [groupInfo, setGroupInfo] = useState<{
    status?: "active" | "pending" | "removed";
    name?: string;
    destination?: string;
    destination_details?: any;
    cover_image?: string | null;
    description?: string | null;
    budget?: number;
    start_date?: string;
    end_date?: string;
  } | null>(null);

  // Fetch group info to check status and populate form
  React.useEffect(() => {
    const fetchGroupInfo = async () => {
      try {
        const response = await fetch(`/api/groups/${groupId}`);
        if (!response.ok) throw new Error("Failed to fetch group info");
        const data = await response.json();
        setGroupInfo(data);
      } catch (err) {
        console.error("Failed to fetch group info:", err);
      }
    };
    if (groupId) {
      fetchGroupInfo();
    }
  }, [groupId]);

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

  // Handle membership errors
  React.useEffect(() => {
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

  const { activeTab, setActiveTab } = useSettingsTabs();
  const isMobile = useIsMobile();
  const [showSidebarMobile, setShowSidebarMobile] = React.useState(true);

  // When tab changes on mobile, show content
  const handleTabChange = React.useCallback(
    (key: string) => {
      setActiveTab(key);
      if (isMobile) setShowSidebarMobile(false);
    },
    [setActiveTab, isMobile]
  );

  // When screen size changes to desktop, always show both
  React.useEffect(() => {
    if (!isMobile) setShowSidebarMobile(true);
  }, [isMobile]);

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
      <div className="max-w-full mx-0 bg-card rounded-3xl shadow-none border border-border overflow-hidden flex items-center justify-center h-[90vh]">
        <div className="text-center max-w-md mx-auto p-8 flex flex-col items-center justify-center">
          <h2 className="text-md font-semibold text-foreground mb-2">
            Join the group to access settings
          </h2>
          <p className="text-xs text-muted-foreground mb-6">
            You need to be a member of this group to view the settings.
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
      <div className="max-w-full mx-0 bg-card rounded-3xl shadow-none border border-border overflow-hidden flex items-center justify-center h-[90vh]">
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
      <div className="max-w-full mx-0 bg-card rounded-3xl shadow-none border border-border overflow-hidden flex items-center justify-center h-[90vh]">
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

  // Responsive layout
  if (isMobile) {
    return (
      <div className="flex flex-col min-h-screen h-full bg-card text-foreground border-1 border-border rounded-3xl">
        {activeTab == null ? (
          <div className="w-full">
            <SettingsSidebar
              activeTab={activeTab ?? ""}
              setActiveTab={handleTabChange}
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header with back button and tab title */}
            <div className="flex items-center gap-2 p-4 px-6 border-b border-border">
              <button
                type="button"
                className="flex items-center gap-2 text-sm text-foreground font-medium focus:outline-none"
                onClick={() => {
                  setActiveTab(null);
                  setShowSidebarMobile(true);
                  // Remove tab param from URL
                  const url = new URL(window.location.href);
                  url.searchParams.delete("tab");
                  // Use router.replace to update the URL without tab param
                  router.replace(url.pathname + url.search, { scroll: false });
                }}
                aria-label="Back to settings list"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    setActiveTab(null);
                    setShowSidebarMobile(true);
                    const url = new URL(window.location.href);
                    url.searchParams.delete("tab");
                    router.replace(url.pathname + url.search, {
                      scroll: false,
                    });
                  }
                }}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <h2 className="text-xs font-semibold text-foreground">
                {(() => {
                  const tabLabels: Record<string, string> = {
                    basic: "Basic Info",
                    travel: "Travel Details",
                    privacy: "Privacy & Safety",
                    members: "Manage Members",
                    requests: "Join Requests",
                    delete: "Leave Group",
                  };
                  return tabLabels[activeTab] || "Settings";
                })()}
              </h2>
            </div>
            {/* Content */}
            <div className="flex-1 p-3">
              <SectionContent
                key={activeTab ?? "none"}
                activeTab={activeTab ?? ""}
                groupId={groupId}
                groupData={groupInfo}
                onGroupUpdate={(data) =>
                  setGroupInfo((prev) => (prev ? { ...prev, ...data } : prev))
                }
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="flex flex-col md:flex-row h-[90vh] bg-card text-foreground border-1 border-border rounded-3xl">
      {/* Sidebar */}
      <div className="w-full md:w-1/4 lg:w-1/5 md:border-r-1 border-border h-full flex flex-col self-stretch">
        <SettingsSidebar
          activeTab={activeTab ?? ""}
          setActiveTab={handleTabChange}
        />
      </div>
      {/* Content */}
      <div className="flex-1 flex flex-col p-3 gap-2 overflow-y-auto scrollbar-hide">
        <SectionContent
          key={activeTab || "none"}
          activeTab={activeTab}
          groupId={groupId}
          groupData={groupInfo}
          onGroupUpdate={(data) =>
            setGroupInfo((prev) => (prev ? { ...prev, ...data } : prev))
          }
        />
      </div>
    </div>
  );
}
