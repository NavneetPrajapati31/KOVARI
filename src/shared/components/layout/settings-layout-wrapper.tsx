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
import { CommunicationSection } from "@/features/groups/components/edit-group-sections/communication-section";
import { PreferencesSection } from "@/features/groups/components/edit-group-sections/preferences-section";
import { AdvancedSection } from "@/features/groups/components/edit-group-sections/advanced-section";

// Import other pages
import MembersPage from "@/app/(app)/groups/[groupId]/settings/members/page";
import RequestPage from "@/app/(app)/groups/[groupId]/settings/requests/page";
import DangerPage from "@/app/(app)/groups/[groupId]/settings/danger/page";

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

    // Travel Details
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    travelStyle: z.enum([
      "adventure",
      "cultural",
      "relaxation",
      "budget",
      "luxury",
      "mixed",
    ]),
    groupSize: z.enum(["2-4", "5-7", "8-10"]),

    // Privacy & Visibility
    visibility: z.enum(["public", "private", "invite-only"]),
    allowJoinRequests: z.boolean(),
    requireApproval: z.boolean(),

    // Safety & Trust
    safetyFeatures: z.object({
      emergencyContacts: z.boolean(),
      locationSharing: z.boolean(),
      panicButton: z.boolean(),
      memberVerification: z.boolean(),
      reportSystem: z.boolean(),
    }),

    // Communication
    communicationSettings: z.object({
      allowDirectMessages: z.boolean(),
      groupChatEnabled: z.boolean(),
      notificationsEnabled: z.boolean(),
      messageModeration: z.boolean(),
    }),

    // Travel Preferences
    interests: z.array(z.string()).min(1, "Select at least one interest"),
    budgetRange: z.enum(["budget", "moderate", "luxury", "flexible"]),
    accommodationType: z.enum([
      "hostel",
      "hotel",
      "airbnb",
      "camping",
      "mixed",
    ]),

    // Advanced Settings
    coverImage: z.string().optional(),
    tags: z.array(z.string()).max(10, "Maximum 10 tags allowed"),
    rules: z
      .string()
      .max(1000, "Rules must be less than 1000 characters")
      .optional(),
  })
  .refine(
    (data) => {
      if (!data.startDate || !data.endDate) return true;
      return new Date(data.startDate) < new Date(data.endDate);
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
  communication: CommunicationSection,
  preferences: PreferencesSection,
  advanced: AdvancedSection,
} as const;

const PAGE_COMPONENTS = {
  members: MembersPage,
  requests: RequestPage,
  delete: DangerPage,
} as const;

// Memoized section content component
const SectionContent = memo(({ activeTab }: { activeTab: string | null }) => {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Initialize form for edit sections
  const form = useForm<EditGroupForm>({
    resolver: zodResolver(editGroupSchema),
    defaultValues: {
      groupName: "",
      description: "",
      destination: "",
      startDate: "",
      endDate: "",
      travelStyle: "mixed",
      groupSize: "5-7",
      visibility: "public",
      allowJoinRequests: true,
      requireApproval: true,
      safetyFeatures: {
        emergencyContacts: true,
        locationSharing: false,
        panicButton: true,
        memberVerification: true,
        reportSystem: true,
      },
      communicationSettings: {
        allowDirectMessages: true,
        groupChatEnabled: true,
        notificationsEnabled: true,
        messageModeration: true,
      },
      interests: [],
      budgetRange: "moderate",
      accommodationType: "mixed",
      tags: [],
      rules: "",
    },
  });

  const handleSectionSubmit = async (sectionId: string) => {
    setIsSubmitting(true);
    try {
      // TODO: Implement API call to update specific section
      console.log(`Updating ${sectionId} section`);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Show success feedback
      console.log(`${sectionId} section updated successfully`);
    } catch (error) {
      console.error(`Error updating ${sectionId} section:`, error);
    } finally {
      setIsSubmitting(false);
    }
  };

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
});

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

  // Responsive layout
  if (isMobile) {
    return (
      <div className="flex flex-col min-h-screen h-full bg-background text-foreground border-1 border-border rounded-3xl">
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
                    communication: "Communication",
                    preferences: "Preferences",
                    advanced: "Advanced",
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
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="flex flex-col md:flex-row min-h-screen h-full bg-background text-foreground border-1 border-border rounded-3xl">
      {/* Sidebar */}
      <div className="w-full md:w-1/4 lg:w-1/5 md:border-r-1 border-border h-full flex flex-col self-stretch">
        <SettingsSidebar
          activeTab={activeTab ?? ""}
          setActiveTab={handleTabChange}
        />
      </div>
      {/* Content */}
      <div className="flex-1 flex flex-col p-3 gap-2 overflow-hidden">
        <SectionContent key={activeTab || "none"} activeTab={activeTab} />
      </div>
    </div>
  );
}
