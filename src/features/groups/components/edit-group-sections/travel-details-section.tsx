"use client";

import React from "react";
import { UseFormReturn } from "react-hook-form";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { MapPin } from "lucide-react";
import { cn, DatePicker } from "@heroui/react";
import { CalendarDate, getLocalTimeZone, today } from "@internationalized/date";
import { optional } from "zod";

interface TravelDetailsSectionProps {
  form: UseFormReturn<any>;
  onSubmit: (sectionId: string) => Promise<void>;
  isSubmitting: boolean;
}

// Utility functions for CalendarDate <-> Date
function dateToCalendarDate(date?: Date): CalendarDate | null {
  if (!date) return null;
  return new CalendarDate(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate()
  );
}

function calendarDateToDate(cd: CalendarDate | null | undefined): Date | null {
  if (!cd) return null;
  return new Date(Date.UTC(cd.year, cd.month - 1, cd.day));
}

export const TravelDetailsSection: React.FC<TravelDetailsSectionProps> = ({
  form,
  onSubmit,
  isSubmitting,
}) => {
  const {
    setValue,
    watch,
    formState: { errors },
  } = form;

  const watchedValues = watch();

  return (
    <>
      <div className="space-y-2 mb-6">
        <h1 className="text-md sm:text-lg font-bold text-foreground">
          Travel Details
        </h1>
        <p className="text-muted-foreground text-xs sm:text-sm max-w-2xl">
          Set your travel dates, style, and group size preferences.
        </p>
      </div>
      <Card className="border-1 border-border bg-transparent">
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="w-full flex flex-col gap-1 space-y-2">
              <Label className="text-xs font-medium">Start Date *</Label>
              <DatePicker
                variant="bordered"
                defaultValue={today(getLocalTimeZone())}
                label="Date"
                minValue={today(getLocalTimeZone())}
                onChange={async (date: any) => {
                  if (date) {
                    const newStartDate = date.toDate();
                    setValue("startDate", newStartDate);

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
                <p className="text-xs text-destructive">
                  {errors.startDate.message?.toString()}
                </p>
              )}
            </div>
            <div className="w-full flex flex-col gap-1 space-y-2">
              <Label className="text-xs font-medium">End Date *</Label>
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
                <p className="text-xs text-destructive">
                  {errors.endDate.message?.toString()}
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="w-full space-y-2">
              <Label htmlFor="travel-style" className="text-xs font-medium">
                Travel Style
              </Label>
              <Select
                onValueChange={(value) => setValue("travelStyle", value as any)}
                defaultValue={watchedValues.travelStyle}
              >
                <SelectTrigger className="h-9 text-sm w-full">
                  <SelectValue placeholder="Select travel style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="adventure">Adventure</SelectItem>
                  <SelectItem value="cultural">Cultural</SelectItem>
                  <SelectItem value="relaxation">Relaxation</SelectItem>
                  <SelectItem value="budget">Budget</SelectItem>
                  <SelectItem value="luxury">Luxury</SelectItem>
                  <SelectItem value="mixed">Mixed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full space-y-2">
              <Label htmlFor="group-size" className="text-xs font-medium">
                Preferred Group Size
              </Label>
              <Select
                onValueChange={(value) => setValue("groupSize", value as any)}
                defaultValue={watchedValues.groupSize}
              >
                <SelectTrigger className="h-9 text-sm w-full">
                  <SelectValue placeholder="Select group size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2-4">2-4 people</SelectItem>
                  <SelectItem value="5-7">5-7 people</SelectItem>
                  <SelectItem value="8-10">8-10 people</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="w-full space-y-2">
              <Label htmlFor="budget-range" className="text-xs font-medium">
                Budget Range
              </Label>
              <Select
                onValueChange={(value) => setValue("budgetRange", value as any)}
                defaultValue={watchedValues.budgetRange}
              >
                <SelectTrigger className="h-9 text-sm w-full">
                  <SelectValue placeholder="Select budget range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="budget">Budget ($)</SelectItem>
                  <SelectItem value="moderate">Moderate ($$)</SelectItem>
                  <SelectItem value="luxury">Luxury ($$$)</SelectItem>
                  <SelectItem value="flexible">Flexible</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full space-y-2">
              <Label
                htmlFor="accommodation-type"
                className="text-xs font-medium"
              >
                Accommodation Type
              </Label>
              <Select
                onValueChange={(value) =>
                  setValue("accommodationType", value as any)
                }
                defaultValue={watchedValues.accommodationType}
              >
                <SelectTrigger className="h-9 text-sm w-full">
                  <SelectValue placeholder="Select accommodation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hostel">Hostel</SelectItem>
                  <SelectItem value="hotel">Hotel</SelectItem>
                  <SelectItem value="airbnb">Airbnb</SelectItem>
                  <SelectItem value="camping">Camping</SelectItem>
                  <SelectItem value="mixed">Mixed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
        <CardContent className="pt-0">
          <Button
            type="button"
            onClick={() => onSubmit("travel")}
            disabled={isSubmitting}
            className="w-full h-9 text-sm"
          >
            {isSubmitting ? "Saving..." : "Save Travel Details"}
          </Button>
        </CardContent>
      </Card>
    </>
  );
};
