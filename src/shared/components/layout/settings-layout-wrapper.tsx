"use client";
import React, { useCallback, memo } from "react";
import SettingsSidebar from "@/shared/components/layout/settings-sidebar";
import { useSettingsTabs } from "@/features/groups/hooks/use-settings-tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

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
const SectionContent = memo(({ activeTab }: { activeTab: string }) => {
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
  if (activeTab in SECTION_COMPONENTS) {
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
  if (activeTab in PAGE_COMPONENTS) {
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
  const { activeTab, setActiveTab } = useSettingsTabs();

  const handleTabChange = useCallback(
    (key: string) => {
      setActiveTab(key);
    },
    [setActiveTab]
  );

  return (
    <div className="flex flex-col md:flex-row min-h-screen h-full bg-background text-foreground border-1 border-border rounded-3xl">
      {/* Top Sidebar (Mobile) / Left Sidebar (Desktop) - Settings Tabs */}
      <div className="w-full md:w-1/4 lg:w-1/5 md:border-r-1 border-border h-full flex flex-col self-stretch">
        <SettingsSidebar activeTab={activeTab} setActiveTab={handleTabChange} />
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col p-3 gap-2 overflow-hidden">
        <SectionContent key={activeTab} activeTab={activeTab} />
      </div>
    </div>
  );
}
