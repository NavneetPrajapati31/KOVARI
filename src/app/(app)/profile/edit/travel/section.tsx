"use client";

import React, { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import {
  ProfileEditForm,
} from "@/features/profile/lib/types";
import SectionRow from "@/features/profile/components/section-row";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { useProfileFieldHandler } from "@/features/profile/hooks/use-profile-field-handler";
import EditSelectModal from "@/shared/components/ui/edit-select-modal";
import EditMultiSelectModal from "@/shared/components/ui/edit-multi-select-modal";
import {
  tripFocusOptions,
  travelFrequencyOptions,
} from "@/features/profile/lib/options";

interface TravelSectionProps {
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

const TravelSection: React.FC<TravelSectionProps> = ({
  form,
  updateProfileField,
}) => {
  const { fieldErrors, handleSaveField } = useProfileFieldHandler({
    form,
    updateProfileField,
  });

  const isMobile = useIsMobile();

  const destinations = form.watch("destinations") || [];
  const tripFocus = form.watch("tripFocus") || [];
  const travelFrequency = form.watch("travelFrequency") || "";

  return (
    <div className={`w-full mx-auto ${isMobile ? "p-0" : "p-4"} space-y-6`}>
      {/* Header */}
      <div className="md:space-y-2 space-y-1">
        <div className="flex items-center justify-between">
          <h1 className="md:text-lg text-md font-semibold text-foreground">
            Travel Preferences
          </h1>
        </div>
        <p className="md:text-sm text-xs text-muted-foreground">
          Update your travel interests and habits.
        </p>
      </div>

      {/* Card Content */}
      <section
        className={`rounded-2xl border border-border ${isMobile ? "bg-transparent p-0 shadow-none" : "bg-transparent p-4 px-6 shadow-none"}`}
      >
        <div className={isMobile ? "space-y-2 px-4 pt-2 pb-4" : ""}>
          <SectionRow
            label="Destinations"
            value={
              destinations.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 py-1">
                  {destinations.map((dest) => (
                    <span
                      key={dest}
                      className="px-2 py-0.5 text-[11px] font-medium bg-blue-500/10 text-blue-600 rounded-full border border-blue-500/20"
                    >
                      {dest}
                    </span>
                  ))}
                </div>
              ) : (
                "Not set"
              )
            }
            onSave={(value) => {
              const deps = typeof value === "string" 
                ? value.split(",").map(d => d.trim()).filter(Boolean)
                : [];
              return handleSaveField("destinations", deps);
            }}
            fieldType="text"
            placeholder="Enter destinations separated by commas"
            error={fieldErrors.destinations}
            editValue={destinations.join(", ")}
          />

          <SectionRow
            label="Trip Focus"
            value={
              tripFocus.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 py-1">
                  {tripFocus.map((focus) => (
                    <span
                      key={focus}
                      className="px-2 py-0.5 text-[11px] font-medium bg-emerald-500/10 text-emerald-600 rounded-full border border-emerald-500/20"
                    >
                      {focus}
                    </span>
                  ))}
                </div>
              ) : (
                "Not set"
              )
            }
            fieldType="popover-multi-select"
            selectOptions={tripFocusOptions.map(t => ({ value: t, label: t }))}
            onSave={(value) => handleSaveField("tripFocus", value as any as string[])}
            editValue={tripFocus}
            error={fieldErrors.tripFocus}
            placeholder="Search trip focus..."
          />

          <SectionRow
            label="Travel Frequency"
            value={
              travelFrequency ? (
                <span className="px-2 py-0.5 text-[11px] font-medium bg-blue-500/10 text-blue-600 rounded-full border border-blue-500/20">
                  {travelFrequency}
                </span>
              ) : (
                "Not set"
              )
            }
            fieldType="select"
            selectOptions={travelFrequencyOptions.map(f => ({ value: f, label: f }))}
            onSave={(value) => handleSaveField("travelFrequency", value as string)}
            editValue={travelFrequency}
            error={fieldErrors.travelFrequency}
            placeholder="Select frequency..."
          />
        </div>
      </section>
    </div>
  );
};

export default TravelSection;
