"use client";

import React, { useEffect, useState, useRef } from "react";
import { UseFormReturn } from "react-hook-form";
import { Upload, Trash2, Loader2, User } from "lucide-react";
import {
  ProfileEditForm,
  profileEditSchema,
} from "@/features/profile/lib/types";
import SectionRow from "@/features/profile/components/section-row";
import { Button } from "@/shared/components/ui/button";
import { Avatar, Spinner } from "@heroui/react";
import { toast } from "sonner";
import { uploadFiles } from "@/lib/uploadthing";

interface GeneralSectionProps {
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

const GeneralSection: React.FC<GeneralSectionProps> = ({
  form,
  profileData,
  isLoading,
  updateProfileField,
}) => {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [usernameCheckLoading, setUsernameCheckLoading] = useState(false);
  const [usernameCheckError, setUsernameCheckError] = useState<string | null>(
    null
  );
  const [avatarUploadLoading, setAvatarUploadLoading] = useState(false);
  const [avatarDeleteLoading, setAvatarDeleteLoading] = useState(false);
  const usernameCheckTimeout = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check username availability with debouncing
  const checkUsernameAvailability = async (
    username: string
  ): Promise<boolean> => {
    if (!username || username.length < 3) return true;

    // Clear previous timeout
    if (usernameCheckTimeout.current) {
      clearTimeout(usernameCheckTimeout.current);
    }

    return new Promise((resolve) => {
      usernameCheckTimeout.current = setTimeout(async () => {
        setUsernameCheckLoading(true);
        setUsernameCheckError(null);

        try {
          const response = await fetch("/api/check-username", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username }),
          });

          const data = await response.json();

          if (!data.available) {
            setUsernameCheckError("Username is already taken");
            resolve(false);
          } else {
            setUsernameCheckError(null);
            resolve(true);
          }
        } catch (error) {
          setUsernameCheckError("Could not check username availability");
          resolve(false);
        } finally {
          setUsernameCheckLoading(false);
        }
      }, 500); // 500ms debounce
    });
  };

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
    console.log(`handleSaveField called with field: ${field}, value:`, value);

    // Clear previous errors
    setFieldErrors((prev) => ({ ...prev, [field]: "" }));
    setUsernameCheckError(null);

    // Validate the field
    const validationError = validateField(field, value);
    console.log(`Validation error for ${field}:`, validationError);

    if (validationError) {
      setFieldErrors((prev) => ({ ...prev, [field]: validationError }));
      console.log(`Validation failed for ${field}:`, validationError);
      return;
    }

    // Special handling for username - check availability
    if (field === "username") {
      const isAvailable = await checkUsernameAvailability(value as string);
      if (!isAvailable) {
        setFieldErrors((prev) => ({
          ...prev,
          [field]: "Username is already taken",
        }));
        return;
      }
    }

    try {
      console.log(`Calling updateProfileField for ${field} with value:`, value);
      await updateProfileField(field, value);
      console.log(`updateProfileField successful for ${field}`);

      form.setValue(field, value);
      console.log(`Form value updated for ${field}:`, value);

      // Clear error on successful save
      setFieldErrors((prev) => ({ ...prev, [field]: "" }));
    } catch (error: any) {
      console.error(`Error in handleSaveField for ${field}:`, error);
      const errorMessage = error.message || "Failed to save field";
      setFieldErrors((prev) => ({ ...prev, [field]: errorMessage }));
    }
  };

  // Handle avatar upload
  const handleAvatarUpload = async (file: File) => {
    // Validate file
    const maxSizeInMB = 4;
    const acceptedFormats = ["PNG", "JPG", "JPEG", "WEBP"];

    if (file.size > maxSizeInMB * 1024 * 1024) {
      toast.error(`File size must be less than ${maxSizeInMB}MB`);
      return;
    }

    const fileExtension = file.name.split(".").pop()?.toUpperCase();
    if (!fileExtension || !acceptedFormats.includes(fileExtension)) {
      toast.error(`Only ${acceptedFormats.join(", ")} files are supported`);
      return;
    }

    setAvatarUploadLoading(true);
    try {
      // Upload to UploadThing
      const uploaded = await uploadFiles("profileImageUploader", {
        files: [file],
      });

      const url = uploaded?.[0]?.url;
      if (url) {
        // Update the avatar field
        await handleSaveField("avatar", url);
        toast.success("Avatar uploaded successfully!");
      } else {
        throw new Error("No URL returned from upload");
      }
    } catch (error) {
      console.error("Avatar upload error:", error);
      toast.error("Failed to upload avatar");
    } finally {
      setAvatarUploadLoading(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      handleAvatarUpload(files[0]);
    }
    // Reset input value to allow selecting the same file again
    if (event.target) {
      event.target.value = "";
    }
  };

  // Handle avatar deletion
  const handleAvatarDelete = async () => {
    const currentAvatar = form.watch("avatar");
    console.log("Current avatar before deletion:", currentAvatar);

    if (!currentAvatar) {
      toast.error("No avatar to delete");
      return;
    }

    setAvatarDeleteLoading(true);
    try {
      console.log("Attempting to delete avatar...");

      // Update the avatar field to empty string
      await handleSaveField("avatar", "");

      console.log("Avatar deletion successful");
      toast.success("Avatar deleted successfully!");

      // Force refresh the form value to ensure UI updates
      form.setValue("avatar", "");
    } catch (error) {
      console.error("Avatar delete error:", error);
      toast.error("Failed to delete avatar");
    } finally {
      setAvatarDeleteLoading(false);
    }
  };

  // Handle upload button click
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const genderOptions = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "other", label: "Other" },
    { value: "prefer_not_to_say", label: "Prefer not to say" },
  ];

  // if (isLoading) {
  //   return (
  //     <div className="w-full mx-auto p-4 space-y-6">
  //       <div className="space-y-2">
  //         <div className="flex items-center justify-between">
  //           <h1 className="text-lg font-semibold text-foreground">
  //             Edit General Info
  //           </h1>
  //         </div>
  //         <p className="text-sm text-muted-foreground">
  //           Update your basic profile details.
  //         </p>
  //       </div>
  //       <section className="bg-transparent rounded-2xl shadow-none border border-border p-4 px-6">
  //         <div className="animate-pulse space-y-4">
  //           <div className="h-20 w-20 bg-gray-200 rounded-full"></div>
  //           <div className="space-y-3">
  //             {[1, 2, 3, 4, 5].map((i) => (
  //               <div key={i} className="h-4 bg-gray-200 rounded"></div>
  //             ))}
  //           </div>
  //         </div>
  //       </section>
  //     </div>
  //   );
  // }

  return (
    <div className="w-full mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-foreground">
            Edit General Info
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Update your basic profile details.
        </p>
      </div>
      {/* Card Content */}
      <section className="bg-transparent rounded-2xl shadow-none border border-border p-4 px-6">
        <div className="flex items-center gap-2 pb-4 border-b-1 border-border">
          <Avatar
            src={form.watch("avatar") || ""}
            className="h-20 w-20"
            showFallback
            fallback={
              <svg
                className="w-full h-full text-gray-600"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="8" r="4" />
                <rect x="4" y="14" width="16" height="6" rx="3" />
              </svg>
            }
          />
          <Button
            size={"sm"}
            className="ml-auto border bg-transparent border-border rounded-lg p-2 text-destructive hover:bg-[#f31260]/20 transition-all duration-300 disabled:opacity-50"
            aria-label="Delete avatar"
            onClick={handleAvatarDelete}
            disabled={
              avatarDeleteLoading ||
              avatarUploadLoading ||
              !form.watch("avatar")
            }
          >
            {avatarDeleteLoading ? (
              <Spinner
                variant="spinner"
                size="sm"
                classNames={{ spinnerBars: "bg-destructive" }}
              />
            ) : (
              <Trash2 className="w-3 h-3" />
            )}
          </Button>
          <Button
            size={"sm"}
            className="bg-transparent border border-border rounded-lg p-1 hover:bg-gray-200 transition-all duration-300 disabled:opacity-50"
            aria-label="Upload avatar"
            onClick={handleUploadClick}
            disabled={avatarUploadLoading || avatarDeleteLoading}
          >
            {avatarUploadLoading ? (
              <Spinner
                variant="spinner"
                size="sm"
                classNames={{ spinnerBars: "bg-black" }}
              />
            ) : (
              <>
                <Upload className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground">
                  Upload
                </span>
              </>
            )}
          </Button>
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".png,.jpg,.jpeg,.webp"
            onChange={handleFileSelect}
            className="hidden"
            aria-label="Select avatar image"
          />
        </div>
        <div>
          <SectionRow
            label="Name"
            value={form.watch("name") || "Not set"}
            onSave={(value) => handleSaveField("name", value as string)}
            fieldType="text"
            error={fieldErrors.name}
            placeholder="Enter your full name"
            maxLength={50}
          />
          <SectionRow
            label="Username"
            value={form.watch("username") || "Not set"}
            onSave={(value) => handleSaveField("username", value as string)}
            fieldType="text"
            error={fieldErrors.username || usernameCheckError}
            isLoading={usernameCheckLoading}
            placeholder="your_username"
            maxLength={32}
          />
          <SectionRow
            label="Age"
            value={form.watch("age") || "Not set"}
            onSave={(value) => handleSaveField("age", Number(value))}
            fieldType="number"
            error={fieldErrors.age}
            placeholder="Enter your age"
            min={18}
            max={120}
          />
          <SectionRow
            label="Gender"
            value={
              form.watch("gender")
                ? genderOptions.find(
                    (opt) => opt.value === form.watch("gender")
                  )?.label || "Not set"
                : "Not set"
            }
            onSave={(value) => handleSaveField("gender", value as string)}
            fieldType="select"
            selectOptions={genderOptions}
            error={fieldErrors.gender}
            placeholder="Select gender"
          />
          <SectionRow
            label="Nationality"
            value={form.watch("nationality") || "Not set"}
            onSave={(value) => handleSaveField("nationality", value as string)}
            fieldType="text"
            error={fieldErrors.nationality}
            placeholder="Enter your nationality"
            maxLength={50}
          />
        </div>
      </section>
    </div>
  );
};

export default GeneralSection;
