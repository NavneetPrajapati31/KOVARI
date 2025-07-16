import React, { useState } from "react";

interface CreatePostModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (newPost: any) => void;
}

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
      setError("Failed to upload image");
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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full h-full flex items-center justify-center">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-auto p-8 flex flex-col items-center gap-6"
          aria-label="Create Post Modal"
        >
          <h2 className="text-xl font-bold text-foreground mb-2">
            Create Post
          </h2>
          <label
            htmlFor="image-upload"
            className="block w-full text-center text-sm font-medium text-gray-700"
          >
            Upload Image
          </label>
          <input
            id="image-upload"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={isUploading || isPosting}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition mb-2"
          />
          <label
            htmlFor="post-title"
            className="block w-full text-center text-sm font-medium text-gray-700"
          >
            Title
          </label>
          <input
            id="post-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isUploading || isPosting}
            className="block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary mb-2"
            placeholder="Enter a title for your post"
            maxLength={100}
            required
          />
          {isUploading && (
            <div className="text-xs text-muted-foreground mb-2">
              Uploading...
            </div>
          )}
          {imageUrl && (
            <div className="flex flex-col items-center gap-2 mb-2">
              <img
                src={imageUrl}
                alt="Preview"
                className="max-h-56 rounded-lg border"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="text-xs px-2 py-1 border rounded bg-gray-100 hover:bg-gray-200"
              >
                Remove
              </button>
            </div>
          )}
          {error && <div className="text-red-500 text-xs mb-2">{error}</div>}
          <div className="flex gap-3 w-full">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading || isPosting}
              className="flex-1 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || isPosting || !imageUrl || !title.trim()}
              className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground font-semibold transition disabled:opacity-50"
            >
              {isPosting ? "Posting..." : "Post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePostModal;
