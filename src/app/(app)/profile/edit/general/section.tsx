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
import ProfileCropModal from "@/shared/components/profile-crop-modal";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { COUNTRIES } from "@/shared/utils/countries";
import EditSelectModal from "@/shared/components/ui/edit-select-modal";
import { useProfileFieldHandler } from "@/features/profile/hooks/use-profile-field-handler";

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
  const [usernameCheckLoading, setUsernameCheckLoading] = useState(false);
  const [usernameCheckError, setUsernameCheckError] = useState<string | null>(
    null
  );
  const [avatarUploadLoading, setAvatarUploadLoading] = useState(false);
  const [avatarDeleteLoading, setAvatarDeleteLoading] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState<string>("");
  const [cropLoading, setCropLoading] = useState(false);
  const usernameCheckTimeout = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();
  const [isNationalityModalOpen, setNationalityModalOpen] = useState(false);

  // Use the custom hook for standard field logic
  const {
    fieldErrors,
    setFieldError,
    validateField,
    handleSaveField: baseHandleSaveField,
  } = useProfileFieldHandler({ form, updateProfileField });

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

  // Custom handleSaveField for username (with availability check)
  const handleSaveField = async (
    field: keyof ProfileEditForm,
    value: string | number | string[]
  ) => {
    setFieldError(field, "");
    setUsernameCheckError(null);
    // Validate the field
    const validationError = validateField(field, value);
    if (validationError) {
      setFieldError(field, validationError);
      return;
    }
    // Special handling for username - check availability
    if (field === "username") {
      const isAvailable = await checkUsernameAvailability(value as string);
      if (!isAvailable) {
        setFieldError(field, "Username is already taken");
        return;
      }
    }
    // Use base handler for save
    await baseHandleSaveField(field, value);
  };

  // Handle avatar upload - now shows crop modal instead of direct upload
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

    // Create temporary URL for the crop modal
    const tempUrl = URL.createObjectURL(file);
    setTempImageUrl(tempUrl);
    setCropModalOpen(true);
  };

  // Handle crop completion
  const handleCropComplete = async (croppedImageUrl: string) => {
    setCropLoading(true);
    try {
      // Convert blob URL to File object for upload
      const response = await fetch(croppedImageUrl);
      const blob = await response.blob();
      const file = new File([blob], "profile-crop.jpg", { type: "image/jpeg" });

      // Upload the cropped image
      const uploaded = await uploadFiles("profileImageUploader", {
        files: [file],
      });

      const url = uploaded?.[0]?.url;
      if (url) {
        // Update the avatar field
        await handleSaveField("avatar", url);
        toast.success("Profile photo updated successfully!");
        setCropModalOpen(false);
      } else {
        throw new Error("No URL returned from upload");
      }
    } catch (error) {
      console.error("Cropped image upload error:", error);
      toast.error("Failed to upload profile photo");
    } finally {
      setCropLoading(false);
      // Clean up temporary URL
      URL.revokeObjectURL(tempImageUrl);
      setTempImageUrl("");
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

  // Handle crop modal close
  const handleCropModalClose = () => {
    setCropModalOpen(false);
    // Clean up temporary URL
    if (tempImageUrl) {
      URL.revokeObjectURL(tempImageUrl);
      setTempImageUrl("");
    }
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
    <div className={`w-full mx-auto ${isMobile ? "p-0" : "p-4"} space-y-6`}>
      {/* Header */}
      <div className="md:space-y-2 space-y-1">
        <div className="flex items-center justify-between">
          <h1 className="md:text-lg text-md font-semibold text-foreground">
            Edit General Info
          </h1>
        </div>
        <p className="md:text-sm text-xs text-muted-foreground">
          Update your basic profile details.
        </p>
      </div>
      {/* Card Content */}
      <section
        className={`rounded-2xl border border-border ${isMobile ? "bg-transparent p-0 shadow-none" : "bg-transparent p-4 px-6 shadow-none"}`}
      >
        {/* Avatar & Buttons */}
        {isMobile ? (
          <div className="flex flex-col items-center justify-center py-4">
            <div className="relative w-fit">
              <Avatar
                src={form.watch("avatar") || ""}
                className="h-28 w-28 mx-auto"
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
            </div>

            <div className="flex items-center gap-1">
              <Button
                className="mt-6 bg-transparent border border-border hover:bg-gray-200 shadow-none rounded-lg px-3 py-1 transition-all duration-300 disabled:opacity-50"
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
                  <span className="text-xs text-primary">
                    Change profile picture
                  </span>
                )}
              </Button>
              <Button
                className="mt-6 px-3 py-1 bg-transparent border border-border shadow-none rounded-lg text-destructive hover:bg-[#f31260]/20 transition-all duration-300"
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
            </div>

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
        ) : (
          <div className="flex items-center gap-1 pb-4 border-b-1 border-border">
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
              size="sm"
              className="ml-auto border bg-transparent border-border rounded-lg px-3 py-1 text-destructive hover:bg-[#f31260]/20 transition-all duration-300 disabled:opacity-50"
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
              size="sm"
              className="bg-transparent border border-border rounded-lg px-3 py-1 hover:bg-gray-200 transition-all duration-300 disabled:opacity-50"
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
                <span className="text-sm text-primary">
                  Change profile picture
                </span>
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
        )}
        <div className={isMobile ? "space-y-2 px-4 pb-4" : ""}>
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
            placeholder="Enter your username"
            maxLength={30}
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
            error={fieldErrors.nationality}
            placeholder="Enter your nationality"
            maxLength={50}
            onEdit={() => setNationalityModalOpen(true)}
          />
        </div>
      </section>

      {/* Profile Crop Modal */}
      <ProfileCropModal
        open={cropModalOpen}
        onOpenChange={handleCropModalClose}
        imageUrl={tempImageUrl}
        onCropComplete={handleCropComplete}
        isLoading={cropLoading}
      />

      <EditSelectModal
        open={isNationalityModalOpen}
        onOpenChange={setNationalityModalOpen}
        label="Nationality"
        options={COUNTRIES}
        value={form.watch("nationality") || ""}
        onSave={(value) => handleSaveField("nationality", value)}
        placeholder="Select your nationality"
      />
    </div>
  );
};

export default GeneralSection;
