"use client";

import React, { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Card, CardContent } from "@/components/ui/card";

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
        return data.endDate >= data.startDate;
      }
      return true;
    },
    {
      message: "End date cannot be before start date",
      path: ["endDate"],
    }
  );

type FormData = z.infer<typeof formSchema>;

export function GroupCreationForm() {
  const [destinationOpen, setDestinationOpen] = useState(false);
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setValue,
    trigger,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      isPublic: true,
    },
  });

  const watchedValues = watch();
  const descriptionLength = watchedValues.description?.length || 0;

  const onSubmit = (data: FormData) => {
    console.log("Form submitted:", data);
    // Handle form submission here
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 md:p-6 custom-autofill-white">
      <Card className="w-full max-w-2xl bg-card shadow-none border-border">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Create a new group
            </h1>
            <p className="text-sm text-muted-foreground">
              Fill in the details below to get started
            </p>
          </div>

          <form
            onSubmit={handleSubmit((data) => onSubmit(data))}
            className="space-y-6"
          >
            {/* Group Name */}
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
                  "h-9 text-sm border-input focus:border-primary focus:ring-primary rounded-lg placeholder:text-muted-foreground",
                  errors.groupName &&
                    "border-red-500 focus:border-red-500 focus:ring-red-500"
                )}
              />
              {errors.groupName && (
                <p className="text-xs text-red-600">
                  {errors.groupName.message}
                </p>
              )}
            </div>

            {/* Destination */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">
                Destination
              </Label>
              <Popover open={destinationOpen} onOpenChange={setDestinationOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={destinationOpen}
                    className={cn(
                      "w-full h-9 justify-between px-4 font-normal text-sm border-input focus:border-primary focus:ring-primary rounded-lg",
                      !watchedValues.destination && "text-muted-foreground",
                      errors.destination && "border-red-500"
                    )}
                  >
                    {watchedValues.destination
                      ? destinations.find(
                          (destination) =>
                            destination.value === watchedValues.destination
                        )?.label
                      : "Select destination"}
                    <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput
                      placeholder="Search destinations..."
                      className="text-sm placeholder:text-muted-foreground"
                    />
                    <CommandList>
                      <CommandEmpty className="text-sm text-muted-foreground">
                        No destination found.
                      </CommandEmpty>
                      <CommandGroup className="max-h-64 overflow-auto">
                        {destinations.map((destination) => (
                          <CommandItem
                            key={destination.value}
                            value={destination.value}
                            onSelect={(currentValue) => {
                              setValue("destination", currentValue);
                              trigger("destination");
                              setDestinationOpen(false);
                            }}
                            className="text-sm text-muted-foreground"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-3.5 w-3.5",
                                watchedValues.destination === destination.value
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {destination.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {errors.destination && (
                <p className="text-xs text-red-600">
                  {errors.destination.message}
                </p>
              )}
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Start Date */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">
                  Start date
                </Label>
                <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full h-9 justify-start px-4 font-normal text-sm border-input focus:border-primary focus:ring-primary rounded-lg",
                        !watchedValues.startDate && "text-muted-foreground",
                        errors.startDate && "border-red-500"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                      {watchedValues.startDate
                        ? format(watchedValues.startDate, "MMM dd, yyyy")
                        : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={watchedValues.startDate}
                      onSelect={(date) => {
                        setValue("startDate", date!);
                        trigger(["startDate", "endDate"]);
                        setStartDateOpen(false);
                      }}
                      disabled={(date) => date < new Date()}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                {errors.startDate && (
                  <p className="text-xs text-red-600">
                    {errors.startDate.message}
                  </p>
                )}
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">
                  End date
                </Label>
                <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full h-9 justify-start px-4 font-normal text-sm border-input focus:border-primary focus:ring-primary rounded-lg",
                        !watchedValues.endDate && "text-muted-foreground",
                        errors.endDate && "border-red-500"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                      {watchedValues.endDate
                        ? format(watchedValues.endDate, "MMM dd, yyyy")
                        : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={watchedValues.endDate}
                      onSelect={(date) => {
                        setValue("endDate", date!);
                        trigger(["startDate", "endDate"]);
                        setEndDateOpen(false);
                      }}
                      disabled={(date) => {
                        const today = new Date();
                        const startDate = watchedValues.startDate;
                        return date < today || (startDate && date < startDate);
                      }}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                {errors.endDate && (
                  <p className="text-xs text-red-600">
                    {errors.endDate.message}
                  </p>
                )}
              </div>
            </div>

            {/* Visibility Toggle */}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <Label className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                Visibility
              </Label>
              <div className="flex items-center space-x-3">
                <span
                  className={cn(
                    "text-xs whitespace-nowrap",
                    !watchedValues.isPublic
                      ? "text-foreground font-medium"
                      : "text-muted-foreground"
                  )}
                >
                  Private
                </span>
                <Switch
                  checked={watchedValues.isPublic}
                  onCheckedChange={(checked) => {
                    setValue("isPublic", checked);
                    trigger("isPublic");
                  }}
                  className="data-[state=checked]:bg-primary"
                />
                <span
                  className={cn(
                    "text-xs whitespace-nowrap",
                    watchedValues.isPublic
                      ? "text-foreground font-medium"
                      : "text-muted-foreground"
                  )}
                >
                  Public
                </span>
              </div>
            </div>

            {/* Description */}
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
                    "min-h-[120px] px-4 py-3 text-sm border-input focus:border-primary focus:ring-primary rounded-lg resize-none placeholder:text-muted-foreground",
                    errors.description &&
                      "border-red-500 focus:border-red-500 focus:ring-red-500"
                  )}
                  maxLength={500}
                />
                <div className="absolute bottom-3 right-3 text-xs text-muted-foreground">
                  {descriptionLength}/500
                </div>
              </div>
              {errors.description && (
                <p className="text-xs text-red-600">
                  {errors.description.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={!isValid}
              className="w-full h-9 text-sm bg-primary hover:bg-primary-hover text-primary-foreground font-medium rounded-lg transition-all duration-200 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed"
            >
              Create Group
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
