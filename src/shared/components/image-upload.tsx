"use client";

import React from "react";
import { useState, useRef, useCallback } from "react";
import { X, ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { cn } from "@/shared/utils/utils";
import { toast } from "sonner";
import { CldUploadWidget } from "next-cloudinary";

interface ImageUploadProps {
  onImageUpload?: (file: File | string) => void;
  onImageRemove?: () => void;
  label?: string;
  className?: string;
  maxSizeInMB?: number;
  acceptedFormats?: string[];
  avatar?: boolean;
  compact?: boolean;
  hideLabel?: boolean;
  value?: string | null;
}

export function ImageUpload({
  onImageUpload,
  onImageRemove,
  label = "Upload Image",
  className,
  maxSizeInMB = 10,
  acceptedFormats = ["PNG", "JPG", "JPEG", "WEBP"],
  compact = false,
  avatar = false,
  hideLabel = false,
  value = null,
}: ImageUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(value ?? null);

  // Sync with value prop when it changes externally (e.g., form reset)
  React.useEffect(() => {
    setUploadedImage(value ?? null);
  }, [value]);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const handleRemoveImage = useCallback(() => {
    setUploadedImage(null);
    setUrlInput("");
    setShowUrlInput(false);
    onImageRemove?.();
  }, [onImageRemove]);

  // Compact/avatar mode
  if (compact) {
    return (
      <CldUploadWidget
        signatureEndpoint="/api/cloudinary/sign"
        options={{
          folder: "kovari-uploads",
          resourceType: "image",
          clientAllowedFormats: ["image"],
          maxFileSize: maxSizeInMB * 1024 * 1024,
        }}
        onUploadAdded={() => setIsUploading(true)}
        onError={(err) => {
          console.error("Upload error:", err);
          toast.error("Failed to upload image");
          setIsUploading(false);
        }}
        onSuccess={(result: any) => {
          if (result.event === "success") {
            const url = result.info.secure_url;
            setUploadedImage(url);
            onImageUpload?.(url);
            toast.success("Image uploaded successfully!");
          }
          setIsUploading(false);
        }}
      >
        {({ open }) => (
          <div
            className={cn(
              "w-full h-full flex items-center justify-center cursor-pointer",
              className
            )}
            onClick={() => open()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") open();
            }}
            tabIndex={0}
            aria-label="Upload profile image"
            role="button"
          >
            {uploadedImage ? (
              <img
                src={uploadedImage}
                alt="Profile"
                className="w-full h-full object-cover rounded-full"
              />
            ) : isUploading ? (
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            ) : (
              <ImageIcon className="w-8 h-8 text-muted-foreground" />
            )}
          </div>
        )}
      </CldUploadWidget>
    );
  }

  if (uploadedImage) {
    return (
      <div className={cn("space-y-2", className)}>
        {!hideLabel && (
          <Label className="text-sm font-medium text-muted-foreground">
            {label}
          </Label>
        )}
        <div className="relative group">
          <div className="relative overflow-hidden rounded-lg border-2  border-border bg-muted/50 p-2">
            <img
              src={uploadedImage || ""}
              alt="Uploaded preview"
              className="w-full h-48 object-cover rounded-md transition-transform duration-200"
            />
            <Button
              type="button"
              // variant="destructive"
              size="icon"
              className="bg-[#F13260] absolute top-4 right-4 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              onClick={handleRemoveImage}
            >
              <X className="h-4 w-4 text-primary-foreground" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {!hideLabel && (
        <Label className="text-sm font-medium text-muted-foreground">
          {label}
        </Label>
      )}
      {/* Main Upload Area */}
      <CldUploadWidget
        signatureEndpoint="/api/cloudinary/sign"
        options={{
          folder: "kovari-uploads",
          resourceType: "image",
          clientAllowedFormats: ["image"],
          maxFileSize: maxSizeInMB * 1024 * 1024,
        }}
        onUploadAdded={() => setIsUploading(true)}
        onError={(err) => {
          console.error("Upload error:", err);
          toast.error("Failed to upload image");
          setIsUploading(false);
        }}
        onSuccess={(result: any) => {
          if (result.event === "success") {
            const url = result.info.secure_url;
            setUploadedImage(url);
            onImageUpload?.(url);
            toast.success("Image uploaded successfully!");
          }
          setIsUploading(false);
        }}
      >
        {({ open }) => (
          <div
            className={cn(
              "relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ease-in-out cursor-pointer",
              isDragOver
                ? "border-primary bg-transparent scale-[1.02]"
                : "border-border bg-transparent hover:border-primary/50 hover:bg-transparent",
              isUploading && "pointer-events-none opacity-50"
            )}
            onClick={() => open()}
          >
            <div className="flex flex-col items-center space-y-4">
              <div
                className={cn(
                  "relative transition-transform duration-300",
                  isDragOver && "scale-110"
                )}
              >
                {isUploading ? (
                  <div className="w-16 h-16 bg-transparent rounded-2xl flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  </div>
                ) : (
                  <div className="w-14 h-14 bg-card border-1 border-border rounded-2xl flex items-center justify-center shadow-sm">
                    <ImageIcon className="w-6 h-6 text-primary" />
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-card rounded-full flex items-center justify-center shadow-md">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">
                  {isUploading ? "Uploading..." : "Click to browse images"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Supports: {acceptedFormats.join(", ")}
                </p>
              </div>
            </div>
          </div>
        )}
      </CldUploadWidget>

      {/* Only show divider and URL import if not avatar mode */}
      {!avatar && (
        <>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-xs ">
              <span className="bg-card px-2 text-muted-foreground">or</span>
            </div>
          </div>

        </>
      )}
    </div>
  );
}
