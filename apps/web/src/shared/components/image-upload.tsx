"use client";

import React from "react";
import { useState, useRef, useCallback } from "react";
import { X, ImageIcon, Loader2, UploadCloud } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { cn } from "@kovari/utils";
import { toast } from "sonner";
import { Spinner } from "@heroui/react";

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement> | File) => {
    let file: File;
    if ("target" in e && e.target.files) {
      if (e.target.files.length === 0) return;
      file = e.target.files[0];
    } else if (e instanceof File) {
      file = e;
    } else {
      return;
    }

    if (file.size > maxSizeInMB * 1024 * 1024) {
      toast.error(`Image must be less than ${maxSizeInMB}MB`);
      return;
    }

    const fileExtension = file.name.split(".").pop()?.toUpperCase();
    if (!fileExtension || !acceptedFormats.includes(fileExtension)) {
      toast.error(`Only ${acceptedFormats.join(", ")} files are supported`);
      return;
    }

    setIsUploading(true);
    try {
      const signRes = await fetch("/api/cloudinary/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: "kovari-uploads" }),
      });
      if (!signRes.ok) throw new Error("Failed to secure upload signature.");
      
      const { signature, timestamp, folder, api_key, cloud_name } = await signRes.json();

      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", api_key);
      formData.append("timestamp", timestamp.toString());
      formData.append("signature", signature);
      formData.append("folder", folder);

      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`, {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) throw new Error("Failed to upload image.");
      
      const data = await uploadRes.json();
      setUploadedImage(data.secure_url);
      onImageUpload?.(data.secure_url);
      toast.success("Image uploaded successfully!");
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Failed to upload image.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Compact/avatar mode
  if (compact) {
    return (
      <div className="relative">
        <input 
          type="file" 
          accept={acceptedFormats.map(ext => `image/${ext.toLowerCase()}`).join(", ")}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          onChange={handleFileUpload}
          disabled={isUploading}
          title="Upload image"
        />
        <div
          className={cn(
            "w-full h-full flex items-center justify-center pointer-events-none",
            className
          )}
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
            <Spinner variant="spinner" size="sm" classNames={{spinnerBars:"bg-primary"}}/>
          ) : (
            <ImageIcon className="w-8 h-8 text-muted-foreground" />
          )}
        </div>
      </div>
    );
  }

  if (uploadedImage) {
    return (
      <div className={cn("space-y-2", className)}>
        {!hideLabel && (
          <Label className="text-xs sm:text-sm font-medium text-muted-foreground">
            {label}
          </Label>
        )}
        <div className="relative group">
          <div className="relative overflow-hidden rounded-lg border border-border bg-muted/50 p-0">
            <img
              src={uploadedImage || ""}
              alt="Uploaded preview"
              className="w-full h-48 object-cover rounded-md transition-transform duration-200"
            />
            <Button
              variant="outline"
              size="icon"
              className="absolute top-3 right-3 h-8 w-8 rounded-full text-muted-foreground transition-opacity duration-200 focus:outline-none focus:ring-0 bg-secondary hover:bg-secondary hover:text-muted-foreground backdrop-blur-lg border !border-border [transform:translateZ(0)] opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
              onClick={handleRemoveImage}
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {!hideLabel && (
        <Label className="text-xs sm:text-sm font-medium text-muted-foreground">
          {label}
        </Label>
      )}
      {/* Main Upload Area */}
      <div className="relative group/uploader">
        <input 
          type="file" 
          accept={acceptedFormats.map(ext => `image/${ext.toLowerCase()}`).join(", ")}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          onChange={handleFileUpload}
          disabled={isUploading}
          title="Browse file"
        />
        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (!isUploading) setIsDragOver(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setIsDragOver(false);
          }}
          onDrop={handleDrop}
          className={cn(
            "relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ease-in-out pointer-events-none",
            isDragOver
              ? "border-primary bg-transparent scale-[1.02]"
              : "border-border bg-transparent hover:border-primary/50 hover:bg-transparent",
            isUploading && "pointer-events-none opacity-50"
          )}
        >
          <div className="flex flex-col items-center space-y-3">
            <div
              className={cn(
                "relative transition-all duration-300",
                isDragOver && "scale-110"
              )}
            >
              {isUploading ? (
                <div className="w-12 h-12 bg-transparent rounded-2xl flex items-center justify-center">
                  <Spinner variant="spinner" size="md" classNames={{spinnerBars:"bg-primary"}}/>
                </div>
              ) : (
                 <div className={cn(
                  "w-12 h-12 bg-card border border-border/50 rounded-full flex items-center justify-center transition-all duration-300 ease-out",
                  "group-hover/uploader:scale-110 ",
                  isDragOver && "scale-110 ring-4 ring-primary/20 border-primary"
                )}>
                  <ImageIcon className="w-5 h-5 text-muted-foreground group-hover/uploader:text-primary transition-colors duration-300" />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-xs sm:text-sm font-medium text-foreground">
                {isUploading ? "Uploading..." : "Drag & drop or click to browse"}
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                Supports: {acceptedFormats.join(", ")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

