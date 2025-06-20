"use client";

import type React from "react";
import { useState, useRef, useCallback } from "react";
import { X, ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { uploadFiles } from "@/utils/uploadthing";

interface ImageUploadProps {
  onImageUpload?: (file: File | string) => void;
  onImageRemove?: () => void;
  label?: string;
  className?: string;
  maxSizeInMB?: number;
  acceptedFormats?: string[];
}

export function ImageUpload({
  onImageUpload,
  onImageRemove,
  label = "Upload Image",
  className,
  maxSizeInMB = 10,
  acceptedFormats = ["PNG", "JPG", "JPEG", "WEBP"],
}: ImageUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    // Check file size
    if (file.size > maxSizeInMB * 1024 * 1024) {
      toast.error(`File size must be less than ${maxSizeInMB}MB`);
      return false;
    }

    // Check file type
    const fileExtension = file.name.split(".").pop()?.toUpperCase();
    if (!fileExtension || !acceptedFormats.includes(fileExtension)) {
      toast.error(`Only ${acceptedFormats.join(", ")} files are supported`);
      return false;
    }

    return true;
  };

  const handleFileUpload = useCallback(
    async (file: File) => {
      if (!validateFile(file)) return;

      setIsUploading(true);
      try {
        // Upload to UploadThing
        const uploaded = await uploadFiles("profileImageUploader", {
          files: [file],
        });
        const url = uploaded?.[0]?.url;
        if (url) {
          setUploadedImage(url);
          onImageUpload?.(url);
          toast.success("Image uploaded successfully!");
        } else {
          throw new Error("No URL returned from upload");
        }
      } catch (error) {
        console.error("Upload error:", error);
        toast.error("Failed to upload image");
      } finally {
        setIsUploading(false);
      }
    },
    [onImageUpload, maxSizeInMB, acceptedFormats]
  );

  const handleUrlUpload = useCallback(async () => {
    if (!urlInput.trim()) {
      toast.error("Please enter a valid URL");
      return;
    }

    setIsUploading(true);
    try {
      // Validate URL format
      const url = new URL(urlInput);

      // Check if it's an image URL (basic check)
      const imageExtensions = ["jpg", "jpeg", "png", "webp", "gif"];
      const urlPath = url.pathname.toLowerCase();
      const hasImageExtension = imageExtensions.some((ext) =>
        urlPath.endsWith(`.${ext}`)
      );

      if (!hasImageExtension) {
        toast.error("URL must point to an image file");
        setIsUploading(false);
        return;
      }

      // Call backend API to import and upload image
      const response = await fetch("/api/upload-image-from-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlInput }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Failed to import image");
        setIsUploading(false);
        return;
      }
      setUploadedImage(data.url);
      onImageUpload?.(data.url);
      setUrlInput("");
      setShowUrlInput(false);
      toast.success("Image imported successfully!");
    } catch (error) {
      toast.error("Please enter a valid image URL");
    } finally {
      setIsUploading(false);
    }
  }, [urlInput, onImageUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFileUpload(files[0]);
      }
    },
    [handleFileUpload]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFileUpload(files[0]);
      }
    },
    [handleFileUpload]
  );

  const handleRemoveImage = useCallback(() => {
    if (uploadedImage) {
      URL.revokeObjectURL(uploadedImage);
    }
    setUploadedImage(null);
    setUrlInput("");
    setShowUrlInput(false);
    onImageRemove?.();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [uploadedImage, onImageRemove]);

  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  if (uploadedImage) {
    return (
      <div className={cn("space-y-2", className)}>
        <Label className="text-sm font-medium text-muted-foreground">
          {label}
        </Label>
        <div className="relative group">
          <div className="relative overflow-hidden rounded-lg border-2 border-dashed border-border bg-muted/50 p-4">
            <img
              src={uploadedImage || "/placeholder.svg"}
              alt="Uploaded preview"
              className="w-full h-48 object-cover rounded-md transition-transform duration-200"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              onClick={handleRemoveImage}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <Label className="text-sm font-medium text-muted-foreground">
        {label}
      </Label>

      {/* Main Upload Area */}
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ease-in-out",
          isDragOver
            ? "border-primary bg-primary/5 scale-[1.02]"
            : "border-border bg-muted/20 hover:border-primary/50 hover:bg-muted/30",
          isUploading && "pointer-events-none opacity-50"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFormats
            .map((format) => `.${format.toLowerCase()}`)
            .join(",")}
          onChange={handleFileSelect}
          className="hidden"
          title="Upload image file"
          placeholder="Choose an image file"
        />

        <div className="flex flex-col items-center space-y-4">
          <div
            className={cn(
              "relative transition-transform duration-300",
              isDragOver && "scale-110"
            )}
          >
            {isUploading ? (
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : (
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <ImageIcon className="w-8 h-8 text-white" />
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-base font-medium text-foreground">
              {isUploading ? "Uploading..." : "Drop your image here, or "}
              {!isUploading && (
                <button
                  type="button"
                  onClick={openFileDialog}
                  className="text-primary hover:text-primary/80 underline transition-colors duration-200"
                >
                  browse
                </button>
              )}
            </p>
            <p className="text-sm text-muted-foreground">
              Supports: {acceptedFormats.join(", ")}
            </p>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">or</span>
        </div>
      </div>

      {/* URL Import Section */}
      <div className="space-y-3">
        <h3 className="text-base font-medium text-foreground">
          Import from URL
        </h3>

        <div className="flex space-x-2">
          <div className="flex-1">
            <Input
              type="url"
              placeholder="Add file URL"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="h-9 text-sm"
              disabled={isUploading}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleUrlUpload}
            disabled={!urlInput.trim() || isUploading}
            className="px-4 h-9 transition-all duration-200 hover:scale-105"
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Upload"
            )}
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
          >
            <div className="w-4 h-4 border border-muted-foreground rounded-full flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full"></div>
            </div>
            <span>Help Centre</span>
          </button>

          <div className="flex space-x-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemoveImage}
              className="h-8 px-3 text-sm transition-all duration-200 hover:scale-105"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleUrlUpload}
              disabled={!urlInput.trim() || isUploading}
              className="h-8 px-3 text-sm bg-primary hover:bg-primary/90 transition-all duration-200 hover:scale-105"
            >
              Import
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
