"use client";

import type React from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { cn } from "@/shared/utils/utils";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Card, CardContent } from "@/shared/components/ui/card";
import { LocationAutocomplete } from "@/shared/components/ui/location-autocomplete";
import { DatePicker } from "@heroui/react";
import { getLocalTimeZone, today } from "@internationalized/date";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Switch } from "@/shared/components/ui/switch";
import { ImageUpload } from "@/shared/components/image-upload";



const formSchema = z
  .object({
    groupName: z
      .string()
      .min(1, "Group name is required")
      .min(3, "Group name must be at least 3 characters"),
    destination: z.string().min(1, "Please select a destination"),
    destinationDetails: z.any().optional(),
    budget: z
      .number({ invalid_type_error: "Budget is required" })
      .min(1000, "Budget must be at least 1,000")
      .max(1000000, "Budget too high"),
    startDate: z.date({
      required_error: "Start date is required",
    }),
    endDate: z.date({
      required_error: "End date is required",
    }),
    isPublic: z.boolean(),
    strictlyNonSmoking: z.boolean(),
    strictlyNonDrinking: z.boolean(),
    description: z
      .string()
      .max(500, "Description cannot exceed 500 characters")
      .optional(),
    coverImage: z.union([z.instanceof(File), z.string()]).optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        const start = new Date(data.startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(data.endDate);
        end.setHours(0, 0, 0, 0);
        return end > start;
      }
      return true;
    },
    {
      message: "End date must be after start date",
      path: ["endDate"],
    }
  );

type FormData = z.infer<typeof formSchema>;

export function GroupCreationForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const todayJs = new Date();
  const tomorrowJs = new Date(todayJs);
  tomorrowJs.setDate(tomorrowJs.getDate() + 1);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    watch,
    setValue,
    trigger,
    setError: setFormError,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      isPublic: true,
      strictlyNonSmoking: false,
      strictlyNonDrinking: false,
      startDate: todayJs,
      endDate: tomorrowJs,
      budget: 10000,
    },
  });

  const watchedValues = watch();
  const descriptionLength = watchedValues.description?.length || 0;

  const validateDates = async (startDate: Date, endDate: Date) => {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);

    if (end <= start) {
      setFormError("endDate", {
        type: "manual",
        message: "End date must be after start date",
      });
      return false;
    } else {
      setFormError("endDate", {
        type: "manual",
        message: undefined,
      });
      if (errors.endDate) {
        delete errors.endDate;
      }
      return true;
    }
  };

  const handleImageUpload = (file: File | string) => {
    setValue("coverImage", file);
    trigger("coverImage");
  };

  const handleImageRemove = () => {
    setValue("coverImage", undefined);
    trigger("coverImage");
  };

  const isFormValid = () => {
    const hasRequiredFields = Boolean(
      watchedValues.groupName &&
        watchedValues.destination &&
        watchedValues.startDate &&
        watchedValues.endDate
    );

    const hasNoErrors = Object.keys(errors).length === 0;

    const datesAreValid = Boolean(
      watchedValues.startDate &&
        watchedValues.endDate &&
        new Date(watchedValues.endDate).getTime() >
          new Date(watchedValues.startDate).getTime()
    );

    console.log("Form Validation State:", {
      hasRequiredFields,
      hasNoErrors,
      datesAreValid,
      errors: Object.keys(errors),
      values: {
        groupName: watchedValues.groupName,
        destination: watchedValues.destination,
        startDate: watchedValues.startDate,
        endDate: watchedValues.endDate,
        coverImage: watchedValues.coverImage,
      },
    });

    return hasRequiredFields && hasNoErrors && datesAreValid;
  };

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      let response;
      // If coverImage is a File, use FormData
      if (data.coverImage instanceof File) {
        const formData = new FormData();
        formData.append("name", data.groupName);
        formData.append("destination", data.destination);
        if (data.destinationDetails) {
          formData.append("destination_details", JSON.stringify(data.destinationDetails));
        }
        formData.append("start_date", format(data.startDate, "yyyy-MM-dd"));
        formData.append("end_date", format(data.endDate, "yyyy-MM-dd"));
        formData.append("is_public", String(data.isPublic));
        formData.append("non_smokers", String(data.strictlyNonSmoking));
        formData.append("non_drinkers", String(data.strictlyNonDrinking));
        if (data.description) {
          formData.append("description", data.description);
        }
        formData.append("cover_image", data.coverImage);

        response = await fetch("/api/create-group", {
          method: "POST",
          body: formData,
        });
      } else {
        // coverImage is a string (URL) or undefined
        const payload = {
          name: data.groupName,
          destination: data.destination,
          destination_details: data.destinationDetails,
          start_date: format(data.startDate, "yyyy-MM-dd"),
          end_date: format(data.endDate, "yyyy-MM-dd"),
          is_public: data.isPublic,
          non_smokers: data.strictlyNonSmoking,
          non_drinkers: data.strictlyNonDrinking,
          description: data.description || undefined,
          cover_image: data.coverImage,
        };
        response = await fetch("/api/create-group", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create group");
      }

      const responseData = await response.json();
      const groupId = responseData.groupId || responseData.id;

      if (!groupId) {
        throw new Error("Group created but no group ID returned");
      }

      toast.success("Group created successfully");
      router.push(`/groups/${groupId}/home`);
    } catch (err) {
      console.error("Error creating group:", err);
      setError(err instanceof Error ? err.message : "Failed to create group");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 md:p-6 custom-autofill-white">
      <Card className="w-full max-w-4xl bg-card shadow-none border-border py-2">
        <CardContent className="p-7">
          <div className="text-center mb-8">
            <h1 className="text-lg font-bold text-foreground mb-2">
              Create a new group
            </h1>
            <p className="text-sm text-muted-foreground">
              Fill in the details below to get started
            </p>
          </div>

          {error && (
            <div className="mb-4 px-3 py-2 bg-[#F13260]/25 border border-[#F13260] rounded-md">
              <p className="text-sm text-[#F13260]">{error}</p>
            </div>
          )}

          <form
            onSubmit={handleSubmit((data) => onSubmit(data))}
            className="space-y-6"
          >
            <div className="space-y-2">
              <Label
                htmlFor="groupName"
                className="text-sm font-medium text-muted-foreground"
              >
                Group name
              </Label>
              <Input
                id="groupName"
                {...register("groupName")}
                placeholder="Enter group name"
                className={cn(
                  "h-9 text-sm border-input focus:border-primary focus:ring-primary rounded-md placeholder:text-muted-foreground",
                  errors.groupName &&
                    "border-[#F31260] focus:border-[#F31260] focus:ring-[#F31260] placeholder:text-[#F31260]"
                )}
              />
              {errors.groupName && (
                <p className="text-sm text-[#F31260]">
                  {errors.groupName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">
                Destination
              </Label>
              <LocationAutocomplete
                value={watchedValues.destination}
                onChange={(val) => {
                  setValue("destination", val);
                  if (val) trigger("destination");
                }}
                onSelect={(data) => {
                  setValue("destination", data.city || data.formatted.split(",")[0].trim()); // Store only city name or first part
                  setValue("destinationDetails", {
                    city: data.city,
                    state: data.state,
                    country: data.country,
                    latitude: data.lat,
                    longitude: data.lon,
                    formatted_address: data.formatted,
                    place_id: data.place_id
                  });
                  trigger("destination");
                }}
                placeholder="Search destination"
                className={cn(
                  "bg-white",
                  errors.destination && "border-[#F31260]"
                )}
              />
              {errors.destination && (
                <p className="text-sm text-[#F31260]">
                  {errors.destination.message}
                </p>
              )}
            </div>

            <div className="mb-4 space-y-2">
              <Label htmlFor="budget" className="text-sm font-medium text-muted-foreground">Budget (INR)</Label>
              <Input
                id="budget"
                type="number"
                min={1000}
                max={1000000}
                step={1000}
                {...register("budget", { valueAsNumber: true })}
                className="mt-1"
              />
              {errors.budget && (
                <p className="text-sm text-[#F31260]">
                  {errors.budget.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-3">
              <div className="w-full flex flex-col gap-1 space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  Start date
                </Label>
                <DatePicker
                  variant="bordered"
                  defaultValue={today(getLocalTimeZone())}
                  label="Date"
                  minValue={today(getLocalTimeZone())}
                  onChange={async (date: any) => {
                    if (date) {
                      const newStartDate = date.toDate();
                      setValue("startDate", newStartDate);

                      if (watchedValues.endDate) {
                        await validateDates(
                          newStartDate,
                          watchedValues.endDate
                        );
                      }

                      if (
                        watchedValues.endDate &&
                        newStartDate > watchedValues.endDate
                      ) {
                        const newEndDate = new Date(newStartDate);
                        newEndDate.setDate(newEndDate.getDate() + 1);
                        setValue("endDate", newEndDate);
                      }
                    }
                  }}
                  classNames={{
                    inputWrapper: cn(
                      "w-full text-sm border-input focus:border-primary focus:ring-primary rounded-md border-1 border-border hover:border-border",
                      errors.startDate &&
                        "border-[#F31260] focus:border-[#F31260] focus:ring-[#F31260]"
                    ),
                    calendarContent: cn("!bg-white !opacity-1"),
                  }}
                />
                {errors.startDate && (
                  <p className="text-sm text-[#F31260]">
                    {errors.startDate.message}
                  </p>
                )}
              </div>

              <div className="w-full flex flex-col gap-1 space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  End date
                </Label>
                <DatePicker
                  variant="bordered"
                  defaultValue={today(getLocalTimeZone()).add({ days: 1 })}
                  label="Date"
                  minValue={
                    watchedValues.startDate
                      ? today(getLocalTimeZone()).add({ days: 1 })
                      : undefined
                  }
                  onChange={async (date: any) => {
                    if (date) {
                      const newEndDate = date.toDate();
                      setValue("endDate", newEndDate);

                      if (watchedValues.startDate) {
                        await validateDates(
                          watchedValues.startDate,
                          newEndDate
                        );
                      }
                    }
                  }}
                  classNames={{
                    inputWrapper: cn(
                      "w-full text-sm border-input focus:border-primary focus:ring-primary rounded-md border-1 border-border hover:border-border",
                      errors.endDate &&
                        "border-[#F31260] focus:border-[#F31260] focus:ring-[#F31260]"
                    ),
                    calendarContent: cn("!bg-white !opacity-1"),
                  }}
                />
                {errors.endDate && (
                  <p className="text-sm text-[#F31260]">
                    {errors.endDate.message}
                  </p>
                )}
              </div>
            </div>

            <ImageUpload
              label="Upload Group Cover Image"
              onImageUpload={handleImageUpload}
              onImageRemove={handleImageRemove}
              maxSizeInMB={10}
              acceptedFormats={["PNG", "JPG", "JPEG", "WEBP"]}
            />

            <div className="space-y-2">
              <Label
                htmlFor="description"
                className="text-sm font-medium text-muted-foreground"
              >
                Description
              </Label>
              <div className="relative">
                <Textarea
                  id="description"
                  {...register("description")}
                  placeholder="Tell people what your group is about..."
                  className={cn(
                    "min-h-[120px] px-4 py-3 text-sm border-input focus:border-primary focus:ring-primary rounded-md resize-none placeholder:text-muted-foreground",
                    errors.description &&
                      "border-[#F13260] focus:border-[#F13260] focus:ring-[#F13260]"
                  )}
                  maxLength={500}
                />
                <div className="absolute bottom-3 right-3 text-sm text-muted-foreground">
                  {descriptionLength}/500
                </div>
              </div>
              {errors.description && (
                <p className="text-sm text-[#F13260]">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between bg-transparent rounded-md border-1 border-border p-2.5">
              <Label className="text-sm font-medium text-muted-foreground">
                Make group public
              </Label>
              <Switch
                checked={watchedValues.isPublic}
                onCheckedChange={(checked: boolean) => {
                  setValue("isPublic", checked);
                  trigger("isPublic");
                }}
                className="data-[state=checked]:bg-primary"
              />
            </div>

            <div className="flex items-center justify-between bg-transparent rounded-md border-1 border-border p-2.5">
              <Label className="text-sm font-medium text-muted-foreground">
                Strictly non-smoking group
              </Label>
              <Switch
                checked={watchedValues.strictlyNonSmoking}
                onCheckedChange={(checked: boolean) => {
                  setValue("strictlyNonSmoking", checked);
                  trigger("strictlyNonSmoking");
                }}
                className="data-[state=checked]:bg-primary"
              />
            </div>

            <div className="flex items-center justify-between bg-transparent rounded-md border-1 border-border p-2.5">
              <Label className="text-sm font-medium text-muted-foreground">
                Strictly non-drinking group
              </Label>
              <Switch
                checked={watchedValues.strictlyNonDrinking}
                onCheckedChange={(checked: boolean) => {
                  setValue("strictlyNonDrinking", checked);
                  trigger("strictlyNonDrinking");
                }}
                className="data-[state=checked]:bg-primary"
              />
            </div>

            <Button
              type="submit"
              disabled={!isFormValid() || isSubmitting}
              className="w-full h-10 text-sm bg-primary hover:bg-primary-hover text-primary-foreground font-medium rounded-md transition-all duration-200"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Group"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
