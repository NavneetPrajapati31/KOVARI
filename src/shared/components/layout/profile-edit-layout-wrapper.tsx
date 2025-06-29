"use client";
import React, { useCallback, memo, useEffect } from "react";
import ProfileEditSidebar from "@/shared/components/layout/profile-edit-sidebar";
import { useProfileEditTabs } from "@/features/profile/hooks/use-profile-edit-tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  profileEditSchema,
  ProfileEditForm,
} from "@/features/profile/lib/types";
import { useProfileData } from "@/features/profile/hooks/use-profile-data";
import GeneralSection from "@/app/(app)/profile/edit/general/section";
import ProfessionalSection from "@/app/(app)/profile/edit/professional/section";
import PersonalSection from "@/app/(app)/profile/edit/personal/section";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import Link from "next/link";

const DEFAULT_VALUES: ProfileEditForm = {
  avatar: "",
  name: "",
  username: "",
  age: 0,
  gender: "prefer_not_to_say",
  nationality: "",
  profession: "",
  interests: [],
  languages: [],
  bio: "",
};

const SectionContent = memo(
  ({
    activeTab,
    form,
    isSubmitting,
    onSubmit,
    profileData,
    isLoading,
    updateProfileField,
  }: {
    activeTab: string;
    form: ReturnType<typeof useForm<ProfileEditForm>>;
    isSubmitting: boolean;
    onSubmit: () => void;
    profileData: ProfileEditForm | null;
    isLoading: boolean;
    updateProfileField: (
      field: keyof ProfileEditForm,
      value: string | number | string[]
    ) => Promise<any>;
  }) => {
    if (activeTab === "general") {
      return (
        <GeneralSection
          form={form}
          isSubmitting={isSubmitting}
          onSubmit={onSubmit}
          profileData={profileData}
          isLoading={isLoading}
          updateProfileField={updateProfileField}
        />
      );
    }
    if (activeTab === "professional") {
      return (
        <ProfessionalSection
          form={form}
          isSubmitting={isSubmitting}
          onSubmit={onSubmit}
          profileData={profileData}
          isLoading={isLoading}
          updateProfileField={updateProfileField}
        />
      );
    }
    if (activeTab === "personal") {
      return (
        <PersonalSection
          form={form}
          isSubmitting={isSubmitting}
          onSubmit={onSubmit}
          profileData={profileData}
          isLoading={isLoading}
          updateProfileField={updateProfileField}
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
  const { profileData, isLoading, updateProfileField } = useProfileData();
  const router = useRouter();
  const form = useForm<ProfileEditForm>({
    resolver: zodResolver(profileEditSchema),
    defaultValues: DEFAULT_VALUES,
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Update form with fetched data
  useEffect(() => {
    if (profileData) {
      Object.keys(profileData).forEach((key) => {
        form.setValue(
          key as keyof ProfileEditForm,
          profileData[key as keyof ProfileEditForm]
        );
      });
    }
  }, [profileData, form]);

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

  const handleBackToProfile = useCallback(() => {
    // Check if the user came from the profile page
    const referrer = document.referrer;
    const isFromProfile =
      referrer.includes("/profile") && !referrer.includes("/profile/edit");

    if (isFromProfile && window.history.length > 1) {
      // User came from profile page, go back
      router.back();
    } else {
      // User came from elsewhere or no history, redirect to profile
      router.replace("/profile");
    }
  }, [router]);

  return (
    <div className="flex flex-col min-h-screen h-full bg-background text-foreground border-none rounded-none">
      {/* Breadcrumb */}
      <div className="px-4 py-2">
        <Link href={"/profile"}>
          <Button
            // onClick={handleBackToProfile}
            className="inline-flex items-center gap-1 text-sm bg-transparent text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Profile
          </Button>
        </Link>
      </div>

      {/* Main Content */}
      <div className="flex flex-col md:flex-row min-h-screen h-full bg-background text-foreground border-1 border-border rounded-3xl mx-6 mb-6">
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
            profileData={profileData}
            isLoading={isLoading}
            updateProfileField={updateProfileField}
          />
        </div>
      </div>
    </div>
  );
}
