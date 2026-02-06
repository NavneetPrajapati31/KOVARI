"use client";

import React, { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import {
  ProfileEditForm,
  profileEditSchema,
} from "@/features/profile/lib/types";
import SectionRow from "@/features/profile/components/section-row";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { JOBS } from "@/shared/utils/jobs";
import EditSelectModal from "@/shared/components/ui/edit-select-modal";
import { useProfileFieldHandler } from "@/features/profile/hooks/use-profile-field-handler";

interface ProfessionalSectionProps {
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

const ProfessionalSection: React.FC<ProfessionalSectionProps> = ({
  form,
  updateProfileField,
}) => {
  // Use the custom hook for standard field logic
  const { fieldErrors, handleSaveField } = useProfileFieldHandler({
    form,
    updateProfileField,
  });

  const isMobile = useIsMobile();
  const [isJobModalOpen, setJobModalOpen] = useState(false);

  return (
    <div className={`w-full mx-auto ${isMobile ? "p-0" : "p-4"} space-y-6`}>
      {/* Header */}
      <div className="md:space-y-2 space-y-1">
        <div className="flex items-center justify-between">
          <h1 className="md:text-lg text-sm font-semibold text-foreground">
            Edit Professional Info
          </h1>
        </div>
        <p className="md:text-sm text-xs text-muted-foreground">
          Update your professional details.
        </p>
      </div>
      {/* Card Content */}
      <section
        className={`rounded-2xl border border-border ${isMobile ? "bg-transparent p-0 shadow-none" : "bg-transparent p-4 px-6 shadow-none"}`}
      >
        <div className={isMobile ? "space-y-2 px-4 pt-2 pb-4" : ""}>
          <SectionRow
            label="Profession"
            value={
              form.watch("profession") ? (
                <span className="px-2 py-0.5 text-[11px] font-medium bg-violet-500/10 text-violet-600 rounded-full border border-violet-500/20">
                  {form.watch("profession")}
                </span>
              ) : (
                "-"
              )
            }
            fieldType="popover-select"
            selectOptions={JOBS.map(job => ({ value: job, label: job }))}
            onSave={(value) => handleSaveField("profession", value as string)}
            editValue={form.watch("profession")}
            placeholder="Search profession..."
            error={fieldErrors.profession}
          />
        </div>
      </section>
    </div>
  );
};

export default ProfessionalSection;
