"use client";

import React from "react";
import { UseFormReturn } from "react-hook-form";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Settings, Camera } from "lucide-react";
import { ImageUpload } from "@/shared/components/image-upload";

interface BasicInfoSectionProps {
  form: UseFormReturn<any>;
  onSubmit: (sectionId: string) => Promise<void>;
  isSubmitting: boolean;
}

export const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({
  form,
  onSubmit,
  isSubmitting,
}) => {
  const {
    register,
    watch,
    formState: { errors },
  } = form;

  const watchedValues = watch();
  const descriptionLength = watchedValues.description?.length || 0;

  return (
    <>
      <div className="space-y-2 mb-6">
        <h1 className="text-md sm:text-lg font-bold text-foreground">
          Basic Information
        </h1>
        <p className="text-muted-foreground text-xs sm:text-sm max-w-2xl">
          Update your group&apos;s name, description, and cover image.
        </p>
      </div>
      <Card className="border-1 border-border bg-transparent">
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="group-name" className="text-xs font-medium">
              Group Name *
            </Label>
            <Input
              id="group-name"
              {...register("groupName")}
              placeholder="Enter a memorable group name"
              className={`h-9 text-sm ${
                errors.groupName ? "border-destructive" : ""
              }`}
            />
            {errors.groupName && (
              <p className="text-xs text-destructive">
                {errors.groupName.message?.toString()}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="destination" className="text-xs font-medium">
              Destination *
            </Label>
            <Input
              id="destination"
              {...register("destination")}
              placeholder="e.g., Tokyo, Japan"
              className={`h-9 text-sm ${
                errors.destination ? "border-destructive" : ""
              }`}
            />
            {errors.destination && (
              <p className="text-xs text-destructive">
                {errors.destination.message?.toString()}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-xs font-medium">
              Description
            </Label>
            <div className="relative">
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Tell people what your group is about..."
                className={`min-h-[100px] text-sm resize-none ${
                  errors.description ? "border-destructive" : ""
                }`}
                maxLength={500}
              />
              <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                {descriptionLength}/500
              </div>
            </div>
            {errors.description && (
              <p className="text-xs text-destructive">
                {errors.description.message?.toString()}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium">Cover Image</Label>
            <ImageUpload hideLabel avatar />
          </div>
        </CardContent>
        <CardContent className="pt-0">
          <Button
            type="button"
            onClick={() => onSubmit("basic")}
            disabled={isSubmitting}
            className="w-full h-9 text-sm"
          >
            {isSubmitting ? "Saving..." : "Save Basic Info"}
          </Button>
        </CardContent>
      </Card>
    </>
  );
};
