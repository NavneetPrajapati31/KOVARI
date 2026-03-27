"use client";

import { CldUploadWidget } from "next-cloudinary";
import { toast } from "sonner";
import { CloudUpload } from "lucide-react";
import { useRef } from "react";

export default function ProfileImageUpload({
  onUpload,
}: {
  onUpload: (url: string) => void;
}) {
  const toastId = useRef<string | number | null>(null);

  return (
    <CldUploadWidget
      signatureEndpoint="/api/cloudinary/sign"
      options={{
        folder: "kovari-profiles",
        resourceType: "image",
        clientAllowedFormats: ["image"],
        maxFileSize: 4 * 1024 * 1024,
      }}
      onUploadAdded={() => {
        toastId.current = toast.loading("Uploading image...");
      }}
      onError={(err) => {
        console.error("Upload error:", err);
        if (toastId.current) toast.dismiss(toastId.current);
        toast.error(`Upload failed`);
      }}
      onSuccess={(result: any) => {
        if (result.event === "success") {
          onUpload(result.info.secure_url);
          if (toastId.current) toast.dismiss(toastId.current);
          toast.success("Image uploaded!");
        }
      }}
    >
      {({ open }) => (
        <div 
          onClick={() => open()}
          className="relative w-3 h-3 bg-primary hover:bg-primary-hover text-white rounded-full flex items-center justify-center cursor-pointer transition-colors duration-200 flex-none"
        >
          <CloudUpload className="w-2.5 h-2.5" />
        </div>
      )}
    </CldUploadWidget>
  );
}

