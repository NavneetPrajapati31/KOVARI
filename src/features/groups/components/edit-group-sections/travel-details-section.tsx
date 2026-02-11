"use client";

import React from "react";
import { UseFormReturn } from "react-hook-form";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Card, CardContent } from "@/shared/components/ui/card";
import { cn, DatePicker, Spinner } from "@heroui/react";
import { getLocalTimeZone, parseDate, today } from "@internationalized/date";

interface TravelDetailsSectionProps {
  form: UseFormReturn<any>;
  onSubmit: (sectionId: string) => Promise<void>;
  isSubmitting: boolean;
}

const ISO_DATE_REGEX = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;

const isIsoDateString = (value: unknown): value is string =>
  typeof value === "string" && ISO_DATE_REGEX.test(value);

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
  const timeZone = getLocalTimeZone();

  const startDateString: unknown = watchedValues.startDate;
  const endDateString: unknown = watchedValues.endDate;

  const todayValue = today(timeZone);
  const normalizedStartDateString = isIsoDateString(startDateString)
    ? startDateString
    : todayValue.toString();

  const minEndDateString = parseDate(normalizedStartDateString)
    .add({ days: 1 })
    .toString();

  const normalizedEndDateString =
    isIsoDateString(endDateString) && endDateString >= minEndDateString
      ? endDateString
      : minEndDateString;

  React.useEffect(() => {
    if (normalizedStartDateString !== startDateString) {
      setValue("startDate", normalizedStartDateString, {
        shouldDirty: false,
        shouldValidate: false,
      });
    }
    if (normalizedEndDateString !== endDateString) {
      setValue("endDate", normalizedEndDateString, {
        shouldDirty: false,
        shouldValidate: false,
      });
    }
  }, [
    endDateString,
    normalizedEndDateString,
    normalizedStartDateString,
    setValue,
    startDateString,
  ]);

  return (
    <>
      <div className="space-y-1 mb-6">
        <h1 className="text-md font-bold text-foreground">Travel Details</h1>
        <p className="text-muted-foreground text-xs sm:text-sm max-w-2xl">
          Set your travel dates.
        </p>
      </div>
      <Card className="border-1 border-border bg-transparent">
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="w-full flex flex-col gap-1 space-y-2">
              <Label className="text-xs font-medium">Start Date *</Label>
              <DatePicker
                variant="bordered"
                value={parseDate(normalizedStartDateString)}
                label="Date"
                minValue={todayValue}
                isDisabled={isSubmitting}
                onChange={async (date: unknown) => {
                  if (
                    !date ||
                    typeof (date as { toString?: unknown }).toString !==
                      "function"
                  ) {
                    return;
                  }

                  const nextStartDateString = (
                    date as { toString: () => string }
                  ).toString();
                  if (!isIsoDateString(nextStartDateString)) return;

                  setValue("startDate", nextStartDateString, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });

                  const nextMinEndDateString = parseDate(nextStartDateString)
                    .add({ days: 1 })
                    .toString();

                  if (
                    !isIsoDateString(endDateString) ||
                    endDateString < nextMinEndDateString
                  ) {
                    setValue("endDate", nextMinEndDateString, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  }
                }}
                classNames={{
                  inputWrapper: cn(
                    "w-full text-sm border-input focus:border-primary focus:ring-primary rounded-md border-1 border-border hover:border-border",
                    errors.startDate &&
                      "border-[#F31260] focus:border-[#F31260] focus:ring-[#F31260]",
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
                value={parseDate(normalizedEndDateString)}
                label="Date"
                minValue={parseDate(normalizedStartDateString).add({ days: 1 })}
                isDisabled={isSubmitting}
                onChange={async (date: unknown) => {
                  if (
                    !date ||
                    typeof (date as { toString?: unknown }).toString !==
                      "function"
                  ) {
                    return;
                  }

                  const nextEndDateString = (
                    date as { toString: () => string }
                  ).toString();
                  if (!isIsoDateString(nextEndDateString)) return;

                  setValue("endDate", nextEndDateString, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }}
                classNames={{
                  inputWrapper: cn(
                    "w-full text-sm border-input focus:border-primary focus:ring-primary rounded-md border-1 border-border hover:border-border",
                    errors.endDate &&
                      "border-[#F31260] focus:border-[#F31260] focus:ring-[#F31260]",
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
          <div className="space-y-2">
            <Label htmlFor="budget" className="text-xs font-medium">
              Budget (INR) *
            </Label>
            <Input
              id="budget"
              type="number"
              min={0}
              {...form.register("budget", { valueAsNumber: true })}
              className={cn(
                "h-9 text-sm w-full",
                errors.budget &&
                  "border-destructive focus-visible:ring-destructive",
              )}
              disabled={isSubmitting}
            />
            {errors.budget && (
              <p className="text-xs text-destructive">
                {errors.budget.message?.toString()}
              </p>
            )}
          </div>
        </CardContent>
        <CardContent className="pt-0">
          <Button
            type="button"
            onClick={() => onSubmit("travel")}
            disabled={isSubmitting}
            variant="outline"
            className="w-full h-9 text-sm border-border bg-background hover:bg-muted"
          >
            {isSubmitting ? (
              <>
                <Spinner
                  variant="spinner"
                  size="sm"
                  classNames={{ spinnerBars: "bg-foreground" }}
                />
                Saving...
              </>
            ) : (
              "Save Travel Details"
            )}
          </Button>
        </CardContent>
      </Card>
    </>
  );
};
