import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import {
  ProfileEditForm,
  profileEditSchema,
} from "@/features/profile/lib/types";

interface UseProfileFieldHandlerOptions {
  form: UseFormReturn<ProfileEditForm>;
  updateProfileField: (
    field: keyof ProfileEditForm,
    value: any
  ) => Promise<any>;
  customValidateField?: (
    field: keyof ProfileEditForm,
    value: any
  ) => string | null;
  customHandleSaveField?: (
    field: keyof ProfileEditForm,
    value: any
  ) => Promise<void>;
}

export const useProfileFieldHandler = ({
  form,
  updateProfileField,
  customValidateField,
  customHandleSaveField,
}: UseProfileFieldHandlerOptions) => {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Default validation using zod schema
  const validateField = (
    field: keyof ProfileEditForm,
    value: any
  ): string | null => {
    if (customValidateField) {
      return customValidateField(field, value);
    }
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

  // Default save logic
  const handleSaveField = async (
    field: keyof ProfileEditForm,
    value: any
  ): Promise<boolean> => {
    if (customHandleSaveField) {
      await customHandleSaveField(field, value);
      return true;
    }
    setFieldErrors((prev) => ({ ...prev, [field]: "" }));
    const validationError = validateField(field, value);
    if (validationError) {
      setFieldErrors((prev) => ({ ...prev, [field]: validationError }));
      return false;
    }
    try {
      await updateProfileField(field, value);
      form.setValue(field, value);
      setFieldErrors((prev) => ({ ...prev, [field]: "" }));
      return true;
    } catch (error: any) {
      const errorMessage = error.message || "Failed to save field";
      setFieldErrors((prev) => ({ ...prev, [field]: errorMessage }));
      return false;
    }
  };

  // Allow manual error setting for custom logic
  const setFieldError = (field: keyof ProfileEditForm, error: string) => {
    setFieldErrors((prev) => ({ ...prev, [field]: error }));
  };

  return {
    fieldErrors,
    setFieldError,
    validateField,
    handleSaveField,
  };
};
