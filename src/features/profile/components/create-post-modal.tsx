"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Loader2, Upload, X } from "lucide-react";

interface CreatePostModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (newPost: any) => void;
  onCreate?: (args: {
    imageUrl: string;
    title: string;
    content?: string;
  }) => Promise<void>;
}

// Cloudinary environment variables should be set in your Vercel project settings.
// For local development, ensure they are in your .env.local file.
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`;
const CLOUDINARY_UPLOAD_PRESET =
  process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;

const uploadImage = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  const res = await fetch(CLOUDINARY_UPLOAD_URL, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) throw new Error("Failed to upload image");
  const data = await res.json();
  return data.secure_url;
};

const CreatePostModal: React.FC<CreatePostModalProps> = ({
  open,
  onClose,
  onSuccess,
  onCreate,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await uploadImage(file);
      setImageUrl(url);
      setSelectedFile(file);
    } catch (err) {
      setError(
        "Failed to upload image. Please check your Cloudinary configuration."
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!imageUrl) {
      setError("Please upload an image.");
      return;
    }
    if (!title.trim()) {
      setError("Please enter a title.");
      return;
    }

    setIsPosting(true);
    try {
      if (onCreate) {
        await onCreate({ imageUrl, title: title.trim() });
        setImageUrl("");
        setSelectedFile(null);
        setTitle("");
        onClose();
        return;
      }
      const res = await fetch("/api/user-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_url: imageUrl, title: title.trim() }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create post");
      }

      const newPost = await res.json();
      setImageUrl("");
      setSelectedFile(null);
      setTitle("");
      if (onSuccess) onSuccess(newPost);
      onClose();
      // In a real app, consider using router.refresh() or revalidatePath instead of full reload
      window.location.reload();
    } catch (err: any) {
      setError(err.message || "Failed to create post.");
    } finally {
      setIsPosting(false);
    }
  };

  const handleRemoveImage = () => {
    setImageUrl("");
    setSelectedFile(null);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-center">
            Create Post
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            Upload an image and add a title to create a new post.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="post-title" className="text-sm font-medium">
              Title
            </Label>
            <Input
              id="post-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isUploading || isPosting}
              placeholder="Enter a title for your post"
              maxLength={100}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="image-upload" className="text-sm font-medium">
              Image
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={isUploading || isPosting}
                className="hidden" // Hide the default file input
              />
              <Label
                htmlFor="image-upload"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-input bg-background rounded-md cursor-pointer text-sm font-medium transition-colors"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" /> Choose Image
                  </>
                )}
              </Label>
              {imageUrl && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleRemoveImage}
                  disabled={isUploading || isPosting}
                  className="shrink-0 bg-transparent"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Remove image</span>
                </Button>
              )}
            </div>
            {imageUrl && (
              <div className="relative w-full h-48 overflow-hidden rounded-md border bg-muted flex items-center justify-center">
                <img
                  src={imageUrl || "/placeholder.svg"}
                  alt="Preview"
                  className="object-contain w-full h-full"
                />
              </div>
            )}
          </div>

          {error && (
            <p className="text-destructive text-sm text-center">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isUploading || isPosting}
              className="flex-1 bg-transparent"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isUploading || isPosting || !imageUrl || !title.trim()}
              className="flex-1"
            >
              {isPosting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Posting...
                </>
              ) : (
                "Post"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePostModal;
