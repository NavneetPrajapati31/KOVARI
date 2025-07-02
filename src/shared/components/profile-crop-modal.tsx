"use client";

import React, { useState, useRef, useCallback } from "react";
import ReactCrop, {
  Crop,
  PixelCrop,
  centerCrop,
  makeAspectCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { RotateCcw, Check, X } from "lucide-react";
import { Spinner } from "@heroui/react";

interface ProfileCropModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  onCropComplete: (croppedImageUrl: string) => void;
  isLoading?: boolean;
}

const ProfileCropModal: React.FC<ProfileCropModalProps> = ({
  open,
  onOpenChange,
  imageUrl,
  onCropComplete,
  isLoading = false,
}) => {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [rotation, setRotation] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);

  // Aspect ratio for square crop (1:1)
  const aspect = 1;

  // Function to center the crop on the image
  const centerAspectCrop = useCallback(
    (mediaWidth: number, mediaHeight: number, aspect: number) => {
      return centerCrop(
        makeAspectCrop(
          {
            unit: "%",
            width: 90,
          },
          aspect,
          mediaWidth,
          mediaHeight
        ),
        mediaWidth,
        mediaHeight
      );
    },
    []
  );

  // Handle image load to set initial crop
  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      if (aspect) {
        const { width, height } = e.currentTarget;
        setCrop(centerAspectCrop(width, height, aspect));
      }
    },
    [aspect, centerAspectCrop]
  );

  // Handle rotation
  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Handle crop completion
  const handleCropComplete = (crop: PixelCrop) => {
    setCompletedCrop(crop);
  };

  // Generate cropped image
  const getCroppedImg = useCallback(async (): Promise<string> => {
    if (!imgRef.current || !completedCrop) {
      throw new Error("No image or crop data available");
    }

    const image = imgRef.current;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("No 2d context");
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;

    ctx.imageSmoothingQuality = "high";

    // Apply rotation if needed
    if (rotation !== 0) {
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);
    }

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width,
      completedCrop.height
    );

    if (rotation !== 0) {
      ctx.restore();
    }

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            resolve(url);
          }
        },
        "image/jpeg",
        0.9
      );
    });
  }, [completedCrop, rotation]);

  // Handle save
  const handleSave = async () => {
    if (!completedCrop) {
      return;
    }

    try {
      const croppedImageUrl = await getCroppedImg();
      onCropComplete(croppedImageUrl);
    } catch (error) {
      console.error("Error cropping image:", error);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setCrop(undefined);
    setCompletedCrop(undefined);
    setRotation(0);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Crop Profile Photo
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col space-y-4">
          {/* Image cropping area */}
          <div className="relative bg-gray-100 overflow-hidden max-h-[450px] inline-block mx-auto">
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={handleCropComplete}
              aspect={aspect}
              minWidth={100}
              minHeight={100}
              keepSelection
              className="flex items-center justify-center"
            >
              {imageUrl ? (
                <img
                  ref={imgRef}
                  alt="Crop preview"
                  src={imageUrl}
                  style={{
                    transform: `rotate(${rotation}deg)`,
                    maxWidth: "100%",
                    maxHeight: "400px",
                    objectFit: "contain",
                  }}
                  onLoad={onImageLoad}
                />
              ) : null}
            </ReactCrop>
          </div>

          {/* Controls */}
          {/* <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Drag to adjust crop area
            </div>
          </div> */}
        </div>

        <DialogFooter className="flex gap-1">
          <Button
            type="button"
            variant="outline"
            onClick={handleRotate}
            className="flex items-center gap-1"
            disabled={isLoading}
          >
            <RotateCcw className="w-3 h-3" />
            Rotate
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            <X className="w-3 h-3" />
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={!completedCrop || isLoading}
            className="flex items-center gap-1"
          >
            {isLoading ? (
              <Spinner
                variant="spinner"
                size="sm"
                classNames={{ spinnerBars: "bg-white" }}
              />
            ) : (
              <Check className="w-3 h-3" />
            )}
            Save Photo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileCropModal;
