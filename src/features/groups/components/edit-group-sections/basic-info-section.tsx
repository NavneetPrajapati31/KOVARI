"use client";

import React from "react";
import { UseFormReturn } from "react-hook-form";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Card, CardContent } from "@/shared/components/ui/card";
import { LocationAutocomplete } from "@/shared/components/ui/location-autocomplete";
import { ImageUpload } from "@/shared/components/image-upload";
import { Spinner } from "@heroui/react";

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
    setValue,
    formState: { errors },
  } = form;

  const watchedValues = watch();
  const descriptionLength = watchedValues.description?.length || 0;

  return (
    <>
      <div className="space-y-1 mb-6">
        <h1 className="text-md font-bold text-foreground">Basic Information</h1>
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
              className={`h-9 text-sm w-full ${
                errors.groupName ? "border-destructive" : ""
              }`}
              disabled={isSubmitting}
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
            <LocationAutocomplete
              value={watchedValues.destination}
              onChange={(val) => {
                setValue("destination", val, { shouldDirty: true });
              }}
              onSelect={(data) => {
                setValue("destination", data.city || data.formatted.split(",")[0].trim(), { shouldDirty: true });
                setValue("destinationDetails", {
                  city: data.city,
                  state: data.state,
                  country: data.country,
                  latitude: data.lat,
                  longitude: data.lon,
                  formatted_address: data.formatted,
                  place_id: data.place_id
                }, { shouldDirty: true });
              }}
              placeholder="e.g., Tokyo, Japan"
              className={errors.destination ? "border-destructive" : ""}
              disabled={isSubmitting}
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
                className={`min-h-[100px] text-sm resize-none w-full ${
                  errors.description ? "border-destructive" : ""
                }`}
                maxLength={500}
                disabled={isSubmitting}
              />
              <div className="absolute bottom-2 right-2 text-xs text-muted-foreground pointer-events-none">
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
            <ImageUpload
              hideLabel
              value={watchedValues.coverImage ?? null}
              onImageUpload={(url) =>
                setValue("coverImage", url, { shouldDirty: true })
              }
              onImageRemove={() =>
                setValue("coverImage", null, { shouldDirty: true })
              }
            />
          </div>
        </CardContent>
        <CardContent className="pt-0">
          <Button
            type="button"
            onClick={() => onSubmit("basic")}
            disabled={isSubmitting}
            variant="outline"
            className="w-full h-9 text-sm inline-flex gap-2 border-border bg-background hover:bg-muted"
          >
            {isSubmitting ? (
              <>
                <Spinner
                  variant="spinner"
                  size="sm"
                  classNames={{ spinnerBars: "bg-primary" }}
                />
                Saving...
              </>
            ) : (
              "Save Basic Info"
            )}
          </Button>
        </CardContent>
      </Card>
    </>
  );
};
