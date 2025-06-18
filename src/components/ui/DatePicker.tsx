import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  label: string;
  value?: string;
  onDateChange: (date: string) => void;
  error?: string;
  className?: string;
}

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  ({ label, value, onDateChange, error, className }, ref) => {
    const id = `datepicker-${label.replace(/\s+/g, "-").toLowerCase()}`;
    return (
      <div className="space-y-2">
        <label
          htmlFor={id}
          className="text-sm font-medium text-gray-700 dark:text-gray-200"
        >
          {label}
        </label>
        <input
          id={id}
          ref={ref}
          type="date"
          value={value}
          onChange={(e) => onDateChange(e.target.value)}
          placeholder={label}
          title={label}
          className={cn(
            "w-full rounded-md border border-gray-300 px-3 py-2 text-sm",
            "focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500",
            "dark:border-gray-600 dark:bg-gray-700 dark:text-white",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500",
            className
          )}
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);

DatePicker.displayName = "DatePicker";
