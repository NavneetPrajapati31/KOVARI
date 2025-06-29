"use client";

import React, { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import {
  ProfileEditForm,
  profileEditSchema,
} from "@/features/profile/lib/types";
import SectionRow from "@/features/profile/components/section-row";

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
    <div className="w-full mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-foreground">
            Edit Professional Info
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Update your professional details.
        </p>
      </div>
      {/* Card Content */}
      <section className="bg-transparent rounded-2xl shadow-none border border-border p-2 px-6">
        <div className="divide-y divide-gray-100">
          <SectionRow
            label="Profession"
            value={form.watch("profession") || "-"}
            onSave={(value) => handleSaveField("profession", value as string)}
            fieldType="text"
            error={fieldErrors.profession}
            placeholder="Enter your profession"
            maxLength={50}
          />
        </div>
      </section>
    </div>
  );
};

export default ProfessionalSection;
