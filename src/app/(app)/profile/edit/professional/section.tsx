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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const isMobile = useIsMobile();
  const [isJobModalOpen, setJobModalOpen] = useState(false);

  // Validate a single field with better error handling
  const validateField = (
    field: keyof ProfileEditForm,
    value: any
  ): string | null => {
    try {
      const fieldSchema = profileEditSchema.shape[field];
      if (fieldSchema) {
        fieldSchema.parse(value);
      }
      return null;
    } catch (error: any) {
      if (error.errors && error.errors.length > 0) {
        return error.errors[0].message;
      }
      return "Invalid value";
    }
  };

  const handleSaveField = async (
    field: keyof ProfileEditForm,
    value: string | number | string[]
  ) => {
    // Clear previous errors
    setFieldErrors((prev) => ({ ...prev, [field]: "" }));

    // Validate the field
    const validationError = validateField(field, value);
    if (validationError) {
      setFieldErrors((prev) => ({ ...prev, [field]: validationError }));
      return;
    }

    try {
      await updateProfileField(field, value);
      form.setValue(field, value);
      // Clear error on successful save
      setFieldErrors((prev) => ({ ...prev, [field]: "" }));
    } catch (error: any) {
      const errorMessage = error.message || "Failed to save field";
      setFieldErrors((prev) => ({ ...prev, [field]: errorMessage }));
    }
  };

  return (
    <div className={`w-full mx-auto ${isMobile ? "p-0" : "p-4"} space-y-6`}>
      {/* Header */}
      <div className="md:space-y-2 space-y-1">
        <div className="flex items-center justify-between">
          <h1 className="md:text-lg text-md font-semibold text-foreground">
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
            value={form.watch("profession") || "-"}
            error={fieldErrors.profession}
            placeholder="Enter your profession"
            maxLength={50}
            onEdit={() => setJobModalOpen(true)}
          />
          <EditSelectModal
            open={isJobModalOpen}
            onOpenChange={setJobModalOpen}
            label="Profession"
            options={JOBS}
            value={form.watch("profession") || ""}
            onSave={(value) => handleSaveField("profession", value)}
            placeholder="Select your profession"
          />
        </div>
      </section>
    </div>
  );
};

export default ProfessionalSection;
