"use client";

import { UploadButton as UploadThingButton } from "@uploadthing/react";
import type { UploadRouter } from "@/app/api/uploadthing/core";
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
    <div className="relative w-3 h-3 bg-primary hover:bg-primary-hover text-white rounded-full flex items-center justify-center cursor-pointer transition-colors duration-200">
      <CloudUpload className="w-2.5 h-2.5" />
      <UploadThingButton<UploadRouter, "profileImageUploader">
        endpoint="profileImageUploader"
        appearance={{
          button: "w-full h-full opacity-0 absolute top-0 left-0",
          allowedContent: "hidden",
        }}
        onClientUploadComplete={(res) => {
          console.log("Upload response:", res);
          if (res && res[0]?.url) {
            console.log("Upload complete, URL:", res[0].url);
            onUpload(res[0].url);
            if (toastId.current) {
              toast.dismiss(toastId.current);
            }
            toast.success("Image uploaded!");
          } else {
            console.error("No URL in response:", res);
            if (toastId.current) {
              toast.dismiss(toastId.current);
            }
            toast.error("Failed to get image URL");
          }
        }}
        onUploadError={(error: Error) => {
          console.error("Upload error:", error);
          if (toastId.current) {
            toast.dismiss(toastId.current);
          }
          toast.error(`Upload failed: ${error.message}`);
        }}
        onUploadBegin={() => {
          toastId.current = toast.loading("Uploading image...");
        }}
      />
    </div>
  );
}
