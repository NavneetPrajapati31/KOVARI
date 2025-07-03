"use client";

import React, { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import {
  ProfileEditForm,
  profileEditSchema,
} from "@/features/profile/lib/types";
import SectionRow from "@/features/profile/components/section-row";
import { useIsMobile } from "@/shared/hooks/use-mobile";

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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const isMobile = useIsMobile();

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
    value: string | string[]
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

  // Helper function to validate and process interests/languages input
  const processArrayField = (
    input: string,
    field: "interests" | "languages"
  ): string[] => {
    const items = input
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    // Validate minimum length for interests and languages
    if (field === "interests" && items.length === 0) {
      throw new Error("Please select at least one interest");
    }
    if (field === "languages" && items.length === 0) {
      throw new Error("Please select at least one language");
    }

    return items;
  };

  const handleSaveArrayField = async (
    field: "interests" | "languages",
    value: string
  ) => {
    try {
      const processedValue = processArrayField(value, field);
      await handleSaveField(field, processedValue);
    } catch (error: any) {
      setFieldErrors((prev) => ({ ...prev, [field]: error.message }));
    }
  };

  return (
    <div className={`w-full mx-auto ${isMobile ? "p-0" : "p-4"} space-y-6`}>
      {/* Header */}
      <div className="md:space-y-2 space-y-1">
        <div className="flex items-center justify-between">
          <h1 className="md:text-lg text-md font-semibold text-foreground">
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
            label="Interests"
            value={
              Array.isArray(form.watch("interests")) &&
              form.watch("interests").length > 0
                ? form.watch("interests").join(", ")
                : "-"
            }
            onSave={(value) =>
              handleSaveArrayField("interests", value as string)
            }
            fieldType="text"
            error={fieldErrors.interests}
            placeholder="e.g., Travel, Photography, Music (comma-separated)"
          />
          <SectionRow
            label="Languages"
            value={
              Array.isArray(form.watch("languages")) &&
              form.watch("languages").length > 0
                ? form.watch("languages").join(", ")
                : "-"
            }
            onSave={(value) =>
              handleSaveArrayField("languages", value as string)
            }
            fieldType="text"
            error={fieldErrors.languages}
            placeholder="e.g., English, Spanish, French (comma-separated)"
          />
          <SectionRow
            label="Bio"
            value={form.watch("bio") || "-"}
            onSave={(value) => handleSaveField("bio", value as string)}
            fieldType="textarea"
            error={fieldErrors.bio}
            placeholder="Tell us about yourself..."
            maxLength={300}
          />
        </div>
      </section>
    </div>
  );
};

export default PersonalSection;
