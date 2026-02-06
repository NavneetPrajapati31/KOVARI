"use client";

import React, { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import {
  ProfileEditForm,
  profileEditSchema,
} from "@/features/profile/lib/types";
import SectionRow from "@/features/profile/components/section-row";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { useProfileFieldHandler } from "@/features/profile/hooks/use-profile-field-handler";
import EditSelectModal from "@/shared/components/ui/edit-select-modal";
import EditMultiSelectModal from "@/shared/components/ui/edit-multi-select-modal";
import {
  religionOptions,
  smokingOptions,
  drinkingOptions,
  personalityOptions,
  foodPreferenceOptions,
  languageOptions,
  interestOptions,
} from "@/features/profile/lib/options";

interface PersonalSectionProps {
  form: UseFormReturn<ProfileEditForm>;
  isSubmitting: boolean;
  onSubmit: () => void;
  profileData: ProfileEditForm | null;
  isLoading: boolean;
  updateProfileField: (
    field: keyof ProfileEditForm,
    value: string | number | string[]
  ) => Promise<any>;
}

const PersonalSection: React.FC<PersonalSectionProps> = ({
  form,
  updateProfileField,
}) => {
  // Use the custom hook for standard field logic
  const { fieldErrors, handleSaveField } = useProfileFieldHandler({
    form,
    updateProfileField,
  });

  const isMobile = useIsMobile();

  return (
    <div className={`w-full mx-auto ${isMobile ? "p-0" : "p-4"} space-y-6`}>
      {/* Header */}
      <div className="md:space-y-2 space-y-1">
        <div className="flex items-center justify-between">
          <h1 className="md:text-lg text-sm font-semibold text-foreground">
            Edit Personal Info
          </h1>
        </div>
        <p className="md:text-sm text-xs text-muted-foreground">
          Update your personal details.
        </p>
      </div>
      {/* Card Content */}
      <section
        className={`rounded-2xl border border-border ${isMobile ? "bg-transparent p-0 shadow-none" : "bg-transparent p-4 px-6 shadow-none"}`}
      >
        <div className={isMobile ? "space-y-2 px-4 pt-2 pb-4" : ""}>
          <SectionRow
            label="Bio"
            value={form.watch("bio") || "-"}
            onSave={(value) => handleSaveField("bio", value as string)}
            fieldType="textarea"
            error={fieldErrors.bio}
            placeholder="Tell us about yourself..."
            maxLength={300}
          />
          <SectionRow
            label="Interests"
            value={
              Array.isArray(form.watch("interests")) &&
              (form.watch("interests")?.length ?? 0) > 0 ? (
                <div className="flex flex-wrap gap-1.5 py-1">
                  {form.watch("interests")!.map((interest) => (
                    <span
                      key={interest}
                      className="px-3 py-1 text-sm font-medium bg-secondary text-foreground rounded-full"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              ) : (
                "-"
              )
            }
            fieldType="popover-multi-select"
            selectOptions={interestOptions.map((i) => ({
              value: i,
              label: i,
            }))}
            onSave={(value) => handleSaveField("interests", value as any as string[])}
            editValue={form.watch("interests")}
            error={fieldErrors.interests}
            placeholder="Search interests..."
          />
          <SectionRow
            label="Languages"
            value={
              Array.isArray(form.watch("languages")) &&
              (form.watch("languages")?.length ?? 0) > 0 ? (
                <div className="flex flex-wrap gap-1.5 py-1">
                  {form.watch("languages")!.map((lang) => (
                    <span
                      key={lang}
                      className="px-3 py-1 text-sm font-medium bg-secondary text-foreground rounded-full"
                    >
                      {lang}
                    </span>
                  ))}
                </div>
              ) : (
                "-"
              )
            }
            fieldType="popover-multi-select"
            selectOptions={languageOptions.map((l) => ({ value: l, label: l }))}
            onSave={(value) => handleSaveField("languages", value as any as string[])}
            editValue={form.watch("languages")}
            error={fieldErrors.languages}
            placeholder="Search languages..."
          />
          <SectionRow
            label="Religion"
            value={
              form.watch("religion") ? (
                <span className="text-sm font-medium text-muted-foreground">
                  {form.watch("religion")}
                </span>
              ) : (
                "-"
              )
            }
            fieldType="select"
            selectOptions={religionOptions.map((r) => ({ value: r, label: r }))}
            onSave={(value) => handleSaveField("religion", value as string)}
            editValue={form.watch("religion")}
            error={fieldErrors.religion}
          />
          <SectionRow
            label="Smoking"
            value={
              form.watch("smoking") ? (
                <span className="text-sm font-medium text-muted-foreground">
                  {form.watch("smoking")}
                </span>
              ) : (
                "-"
              )
            }
            fieldType="select"
            selectOptions={smokingOptions.map((s) => ({ value: s, label: s }))}
            onSave={(value) => handleSaveField("smoking", value as string)}
            editValue={form.watch("smoking")}
            error={fieldErrors.smoking}
          />
          <SectionRow
            label="Drinking"
            value={
              form.watch("drinking") ? (
                <span className="text-sm font-medium text-muted-foreground">
                  {form.watch("drinking")}
                </span>
              ) : (
                "-"
              )
            }
            fieldType="select"
            selectOptions={drinkingOptions.map((d) => ({ value: d, label: d }))}
            onSave={(value) => handleSaveField("drinking", value as string)}
            editValue={form.watch("drinking")}
            error={fieldErrors.drinking}
          />
          <SectionRow
            label="Personality"
            value={
              form.watch("personality") ? (
                <span className="text-sm font-medium text-muted-foreground">
                  {form.watch("personality")}
                </span>
              ) : (
                "-"
              )
            }
            fieldType="select"
            selectOptions={personalityOptions.map((p) => ({
              value: p,
              label: p,
            }))}
            onSave={(value) => handleSaveField("personality", value as string)}
            editValue={form.watch("personality")}
            error={fieldErrors.personality}
          />
          <SectionRow
            label="Food Preference"
            value={
              form.watch("foodPreference") ? (
                <span className="text-sm font-medium text-muted-foreground">
                  {form.watch("foodPreference")}
                </span>
              ) : (
                "-"
              )
            }
            fieldType="select"
            selectOptions={foodPreferenceOptions.map((f) => ({
              value: f,
              label: f,
            }))}
            onSave={(value) =>
              handleSaveField("foodPreference", value as string)
            }
            editValue={form.watch("foodPreference")}
            error={fieldErrors.foodPreference}
          />
        </div>
      </section>
    </div>
  );
};

export default PersonalSection;
