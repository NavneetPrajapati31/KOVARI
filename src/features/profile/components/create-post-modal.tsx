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
import { CldUploadWidget } from "next-cloudinary";

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

// Replaced unsecure Cloudinary configuration with CldUploadWidget signature flow

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

  // handleFileChange removed in favor of CldUploadWidget

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
      let res;
      for (let i = 0; i < 3; i++) {
        try {
          res = await fetch("/api/user-posts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              image_url: imageUrl,
              title: title.trim(),
            }),
          });
          if (res.ok) break;
        } catch (e) {
          if (i === 2) throw e;
        }
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
      }

      if (!res || !res.ok) {
        let errMessage = "Failed to create post. Please try again.";
        if (res) {
          try {
            const err = await res.json();
            if (err.error) errMessage = err.error;
          } catch (jsonErr) {}
        }
        throw new Error(errMessage);
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
              <CldUploadWidget
                signatureEndpoint="/api/cloudinary/sign"
                options={{
                  folder: "kovari-posts",
                  resourceType: "image",
                  clientAllowedFormats: ["image"],
                  maxFileSize: 10 * 1024 * 1024, // 10MB
                }}
                onUploadAdded={() => setIsUploading(true)}
                onSuccess={(result: any) => {
                  if (result.event === "success") {
                    setImageUrl(result.info.secure_url);
                  }
                  setIsUploading(false);
                }}
                onError={(err) => {
                  console.error("Upload error:", err);
                  setError("Failed to upload image. Please try again.");
                  setIsUploading(false);
                }}
              >
                {({ open }) => (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => open()}
                    disabled={isUploading || isPosting}
                    className="flex-1 flex items-center justify-center gap-2"
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
                  </Button>
                )}
              </CldUploadWidget>
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
