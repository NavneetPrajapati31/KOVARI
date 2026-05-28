"use client";

import { toast } from "sonner";
import { CloudUpload } from "lucide-react";
import { useRef, useState } from "react";

export default function ProfileImageUpload({
  onUpload,
}: {
  onUpload: (url: string) => void;
}) {
  const toastId = useRef<string | number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      toast.error("File is too large. Max size is 4MB.");
      return;
    }

    setIsUploading(true);
    toastId.current = toast.loading("Uploading image...");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "kovari-profiles");

      const uploadRes = await fetch(`/api/upload/image`, {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) throw new Error("Upload failed");

      const data = await uploadRes.json();
      onUpload(data.secure_url);
      
      if (toastId.current) toast.dismiss(toastId.current);
      toast.success("Image uploaded!");
    } catch (err) {
      console.error("Upload error:", err);
      if (toastId.current) toast.dismiss(toastId.current);
      toast.error("Upload failed");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <input 
        type="file" 
        accept="image/*" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
      />
      <div 
        onClick={() => { if (!isUploading) fileInputRef.current?.click(); }}
        className={`relative w-3 h-3 bg-primary hover:bg-primary-hover text-white rounded-full flex items-center justify-center cursor-pointer transition-colors duration-200 flex-none ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <CloudUpload className="w-2.5 h-2.5" />
      </div>
    </>
  );
}

