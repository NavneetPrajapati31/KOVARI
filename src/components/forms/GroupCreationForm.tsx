"use client";

import React, { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
// import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectItem } from "@heroui/react";
import { DatePicker } from "@heroui/react";
import { getLocalTimeZone, today } from "@internationalized/date";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Switch } from "@heroui/switch";

const destinations = [
  { value: "paris", label: "Paris, France" },
  { value: "tokyo", label: "Tokyo, Japan" },
  { value: "new-york", label: "New York, USA" },
  { value: "london", label: "London, UK" },
  { value: "sydney", label: "Sydney, Australia" },
  { value: "barcelona", label: "Barcelona, Spain" },
  { value: "rome", label: "Rome, Italy" },
  { value: "bali", label: "Bali, Indonesia" },
  { value: "dubai", label: "Dubai, UAE" },
  { value: "singapore", label: "Singapore" },
  { value: "amsterdam", label: "Amsterdam, Netherlands" },
  { value: "berlin", label: "Berlin, Germany" },
  { value: "bangkok", label: "Bangkok, Thailand" },
  { value: "hong-kong", label: "Hong Kong" },
  { value: "seoul", label: "Seoul, South Korea" },
  { value: "mumbai", label: "Mumbai, India" },
  { value: "cairo", label: "Cairo, Egypt" },
  { value: "rio-de-janeiro", label: "Rio de Janeiro, Brazil" },
  { value: "vancouver", label: "Vancouver, Canada" },
  { value: "copenhagen", label: "Copenhagen, Denmark" },
  { value: "athens", label: "Athens, Greece" },
  { value: "budapest", label: "Budapest, Hungary" },
  { value: "dublin", label: "Dublin, Ireland" },
  { value: "lisbon", label: "Lisbon, Portugal" },
  { value: "prague", label: "Prague, Czech Republic" },
  { value: "vienna", label: "Vienna, Austria" },
  { value: "stockholm", label: "Stockholm, Sweden" },
  { value: "oslo", label: "Oslo, Norway" },
  { value: "helsinki", label: "Helsinki, Finland" },
  { value: "warsaw", label: "Warsaw, Poland" },
];

const formSchema = z
  .object({
    groupName: z
      .string()
      .min(1, "Group name is required")
      .min(3, "Group name must be at least 3 characters"),
    destination: z.string().min(1, "Please select a destination"),
    startDate: z.date({
      required_error: "Start date is required",
    }),
    endDate: z.date({
      required_error: "End date is required",
    }),
    isPublic: z.boolean(),
    description: z
      .string()
      .max(500, "Description cannot exceed 500 characters")
      .optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        // Compare dates by setting time to midnight to ignore time differences
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
  const [destinationOpen, setDestinationOpen] = useState(false);
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);

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
      startDate: todayJs,
      endDate: tomorrowJs,
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
      // Clear the error if dates are valid
      setFormError("endDate", {
        type: "manual",
        message: undefined,
      });
      // Clear any existing errors
      if (errors.endDate) {
        delete errors.endDate;
      }
      return true;
    }
  };

  const isFormValid = () => {
    const hasRequiredFields = Boolean(
      watchedValues.groupName &&
        watchedValues.destination &&
        watchedValues.startDate &&
        watchedValues.endDate
    );

    const hasNoErrors = Object.keys(errors).length === 0;

    // Additional check for date validation
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
      },
    });

    return hasRequiredFields && hasNoErrors && datesAreValid;
  };

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      const payload = {
        name: data.groupName,
        destination: data.destination,
        start_date: format(data.startDate, "yyyy-MM-dd"),
        end_date: format(data.endDate, "yyyy-MM-dd"),
        is_public: data.isPublic,
        description: data.description || undefined,
      };

      const response = await fetch("/api/create-group", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create group");
      }

      toast.success("Group created successfully");
      router.push("/group");
    } catch (err) {
      console.error("Error creating group:", err);
      setError(err instanceof Error ? err.message : "Failed to create group");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 md:p-6 custom-autofill-white">
      <Card className="w-full max-w-3xl bg-card shadow-none border-border py-2">
        <CardContent className="p-7">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-2">
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
                className="text-xs font-medium text-muted-foreground"
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
                <p className="text-xs text-[#F31260]">
                  {errors.groupName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">
                Destination
              </Label>
              <Select
                isRequired
                variant="faded"
                size="sm"
                selectedKeys={
                  watchedValues.destination
                    ? new Set([watchedValues.destination])
                    : new Set()
                }
                onSelectionChange={(keys: Set<React.Key> | "all") => {
                  if (keys !== "all" && keys.size > 0) {
                    const selectedValue = Array.from(keys)[0] as string;
                    setValue("destination", selectedValue);
                  } else if (keys !== "all" && keys.size === 0) {
                    setValue("destination", "");
                  }
                  trigger("destination");
                }}
                items={destinations}
                placeholder="Select destination"
                classNames={{
                  trigger: cn(
                    "w-full h-9 text-sm border border-input hover:border-input bg-transparent focus:border-primary focus:ring-primary rounded-md",
                    errors.destination &&
                      "border-[#F31260] focus:border-[#F31260] focus:ring-[#F31260]"
                  ),
                  value: cn("text-muted-foreground"),
                }}
              >
                {(destination) => (
                  <SelectItem key={destination.value}>
                    {destination.label}
                  </SelectItem>
                )}
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-3">
              <div className="w-full flex flex-col gap-1 space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">
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

                      // If end date is before new start date, update it
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
                  }}
                />
                {errors.startDate && (
                  <p className="text-xs text-[#F31260]">
                    {errors.startDate.message}
                  </p>
                )}
              </div>

              <div className="w-full flex flex-col gap-1 space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">
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
                  }}
                />
                {errors.endDate && (
                  <p className="text-xs text-[#F31260]">
                    {errors.endDate.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="description"
                className="text-xs font-medium text-muted-foreground"
              >
                Description (optional)
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
                <div className="absolute bottom-3 right-3 text-xs text-muted-foreground">
                  {descriptionLength}/500
                </div>
              </div>
              {errors.description && (
                <p className="text-xs text-[#F13260]">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between bg-transparent rounded-md border-1 border-border p-2.5">
              <Label className="text-sm text-foreground">
                Make group public
              </Label>
              <Switch
                size="sm"
                checked={watchedValues.isPublic}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setValue("isPublic", e.target.checked);
                  trigger("isPublic");
                }}
                className="data-[state=checked]:bg-primary"
              />
            </div>
            {/* <p className="text-xs text-muted-foreground">
              Public groups can be discovered and joined by anyone. Private
              groups are only visible to invited members.
            </p> */}

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
