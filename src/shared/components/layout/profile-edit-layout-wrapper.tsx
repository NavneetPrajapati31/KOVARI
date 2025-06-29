"use client";
import React, { useCallback, memo } from "react";
import ProfileEditSidebar from "@/shared/components/layout/profile-edit-sidebar";
import { useProfileEditTabs } from "@/features/profile/hooks/use-profile-edit-tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  profileEditSchema,
  ProfileEditForm,
} from "@/features/profile/lib/types";
import GeneralSection from "@/app/(app)/profile/edit/general/section";
import ProfessionalSection from "@/app/(app)/profile/edit/professional/section";
import PersonalSection from "@/app/(app)/profile/edit/personal/section";

const DEFAULT_VALUES: ProfileEditForm = {
  avatar: "https://randomuser.me/api/portraits/women/44.jpg",
  name: "Alex Jackson",
  username: "alexjackson",
  age: 28,
  gender: "female",
  nationality: "USA",
  profession: "Product Designer",
  interests: ["UI/UX", "Travel", "Photography"],
  languages: ["English", "Spanish"],
  bio: "Passionate about design and travel. Always learning new things.",
};

const SectionContent = memo(
  ({
    activeTab,
    form,
    isSubmitting,
    onSubmit,
  }: {
    activeTab: string;
    form: ReturnType<typeof useForm<ProfileEditForm>>;
    isSubmitting: boolean;
    onSubmit: () => void;
  }) => {
    if (activeTab === "general") {
      return (
        <GeneralSection
          form={form}
          isSubmitting={isSubmitting}
          onSubmit={onSubmit}
        />
      );
    }
    if (activeTab === "professional") {
      return (
        <ProfessionalSection
          form={form}
          isSubmitting={isSubmitting}
          onSubmit={onSubmit}
        />
      );
    }
    if (activeTab === "personal") {
      return (
        <PersonalSection
          form={form}
          isSubmitting={isSubmitting}
          onSubmit={onSubmit}
        />
      );
    }
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-muted-foreground">Select a section to get started</p>
      </div>
    );
  }
);
SectionContent.displayName = "SectionContent";

export default function ProfileEditLayoutWrapper() {
  const { activeTab, setActiveTab } = useProfileEditTabs();
  const form = useForm<ProfileEditForm>({
    resolver: zodResolver(profileEditSchema),
    defaultValues: DEFAULT_VALUES,
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleTabChange = useCallback(
    (key: string) => {
      setActiveTab(key);
    },
    [setActiveTab]
  );

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    try {
      // TODO: Implement API call to update profile info
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      // TODO: Error handling
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return (
    <div className="flex flex-col md:flex-row min-h-screen h-full bg-background text-foreground border-none rounded-none">
      {/* Sidebar */}
      <div className="w-full md:w-1/4 lg:w-1/5 md:border-r-1 border-border h-full flex flex-col self-stretch">
        <ProfileEditSidebar
          activeTab={activeTab}
          setActiveTab={handleTabChange}
        />
      </div>
      {/* Content Area */}
      <div className="flex-1 flex flex-col p-3 gap-2 overflow-hidden">
        <SectionContent
          key={activeTab}
          activeTab={activeTab}
          form={form}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
