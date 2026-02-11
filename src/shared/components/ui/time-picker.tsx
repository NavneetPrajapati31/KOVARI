"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, ChevronDownIcon, Clock } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Calendar } from "@/shared/components/ui/calendar";
import { Field, FieldGroup, FieldLabel } from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import { cn } from "@/shared/utils/utils";

// Value format: "YYYY-MM-DDTHH:mm"
function parseValue(value: string | undefined): { date: Date; time: string } {
  if (!value || value.length < 16) {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, "0");
    const m = String(now.getMinutes()).padStart(2, "0");
    return { date: now, time: `${h}:${m}` };
  }
  const [datePart, timePart] = value.split("T");
  const [y, mo, d] = datePart.split("-").map(Number);
  const time = (timePart || "00:00").slice(0, 5);
  return { date: new Date(y, mo - 1, d), time };
}

function toValue(date: Date, time: string): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const [h = "00", min = "00"] = time.split(":");
  return `${y}-${m}-${day}T${h.padStart(2, "0")}:${min.padStart(2, "0")}`;
}

export interface DateTimePickerProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** Match itinerary form: single row, no internal labels */
  variant?: "default" | "compact";
}

/** Controlled date + time picker. Value format: "YYYY-MM-DDTHH:mm". Same UI as TimePicker, styled for forms. */
export function DateTimePicker({
  value,
  onChange,
  placeholder = "Select date and time",
  disabled = false,
  className,
  variant = "compact",
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const timeInputRef = React.useRef<HTMLInputElement | null>(null);
  const { date, time } = parseValue(value);

  const openNativeTimePicker = React.useCallback(() => {
    const el = timeInputRef.current;
    if (!el || disabled) return;
    // `showPicker()` is supported in Chromium; fall back to focus/click.
    (el as any).showPicker?.();
    el.focus();
    el.click();
  }, [disabled]);

  const handleDateSelect = (newDate: Date | undefined) => {
    if (!newDate) return;
    onChange?.(toValue(newDate, time));
    setOpen(false);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(toValue(date, e.target.value));
  };

  const inputBaseClass =
    "rounded-lg border border-border bg-card h-[2.5rem] sm:h-11 w-full min-w-0 focus:outline-none focus:ring-0 focus:border-border";

  if (variant === "default") {
    return (
      <FieldGroup className={cn("mx-auto max-w-xs flex-row", className)}>
        <Field>
          <FieldLabel htmlFor="date-picker-optional">Date</FieldLabel>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                id="date-picker-optional"
                className="w-32 justify-between font-normal bg-card"
              >
                {date ? format(date, "MMMM do, yyyy") : "Select date"}
                <ChevronDownIcon data-icon="inline-end" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto overflow-hidden p-0"
              align="start"
            >
              <Calendar
                mode="single"
                selected={date}
                defaultMonth={date}
                onSelect={handleDateSelect}
              />
            </PopoverContent>
          </Popover>
        </Field>
        <Field className="w-32">
          <FieldLabel htmlFor="time-picker-optional">Time</FieldLabel>
          <div className="relative">
            <Input
              ref={timeInputRef}
              type="time"
              id="time-picker-optional"
              title=""
              step="60"
              value={time}
              onChange={handleTimeChange}
              onClick={openNativeTimePicker}
              disabled={disabled}
              className={cn(
                "bg-card appearance-none pr-9 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none",
                inputBaseClass,
              )}
            />
            <button
              type="button"
              aria-label="Open time picker"
              onClick={openNativeTimePicker}
              disabled={disabled}
              className={cn(
                "absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground",
                "hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed",
              )}
            >
              <Clock className="h-4 w-4" />
            </button>
          </div>
        </Field>
      </FieldGroup>
    );
  }

  // Compact: single row, no labels (parent provides "Date & Time" label). Show date only in trigger; time is in the separate time input.
  const displayText =
    value && value.length >= 10 ? format(date, "MMMM do, yyyy") : placeholder;

  return (
    <div className={cn("flex flex-col sm:flex-row gap-2 w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className={cn(
              "justify-between font-medium placeholder:font-normal text-foreground border-border bg-card hover:bg-muted/50 hover:border-border",
              "h-[2.5rem] sm:h-11 min-h-[2.5rem] sm:min-h-11 rounded-lg flex-1 min-w-0 w-full sm:w-auto",
              !value || value.length < 10 ? "text-muted-foreground" : "",
            )}
          >
            <span className="flex items-center gap-2 truncate">
              <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
              {displayText}
            </span>
            <ChevronDownIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto overflow-hidden p-0 rounded-lg border-border"
          align="start"
        >
          <Calendar
            mode="single"
            selected={date}
            defaultMonth={date}
            onSelect={handleDateSelect}
          />
        </PopoverContent>
      </Popover>
      <div className="relative w-full sm:w-auto sm:flex-shrink-0 sm:min-w-[7rem]">
        <Input
          ref={timeInputRef}
          type="time"
          title=""
          value={time}
          onChange={handleTimeChange}
          onClick={openNativeTimePicker}
          disabled={disabled}
          step="60"
          className={cn(
            inputBaseClass,
            "sm:w-[7rem] sm:min-w-[7rem] pr-9",
            // Hide the native indicator (we render our own clock icon button).
            "[&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:pointer-events-none",
          )}
        />
        <button
          type="button"
          aria-label="Open time picker"
          onClick={openNativeTimePicker}
          disabled={disabled}
          className={cn(
            "absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground",
            "hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed",
          )}
        >
          <Clock className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/** Uncontrolled demo: date + time side by side with labels. */
export function TimePicker() {
  const [open, setOpen] = React.useState(false);
  const [date, setDate] = React.useState<Date | undefined>(undefined);

  return (
    <FieldGroup className="mx-auto max-w-xs flex-row">
      <Field>
        <FieldLabel htmlFor="date-picker-optional">Date</FieldLabel>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              id="date-picker-optional"
              className="w-32 justify-between font-normal"
            >
              {date ? format(date, "PPP") : "Select date"}
              <ChevronDownIcon data-icon="inline-end" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              defaultMonth={date}
              onSelect={(date) => {
                setDate(date);
                setOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>
      </Field>
      <Field className="w-32">
        <FieldLabel htmlFor="time-picker-optional">Time</FieldLabel>
        <Input
          type="time"
          id="time-picker-optional"
          title=""
          step="1"
          defaultValue="10:30:00"
          className="bg-card appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
        />
      </Field>
    </FieldGroup>
  );
}
