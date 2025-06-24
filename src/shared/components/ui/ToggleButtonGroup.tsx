"use client";

import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import { cn } from "@/shared/utils/utils";

interface ToggleButtonGroupProps {
  label?: string;
  options: string[];
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export function ToggleButtonGroup({
  label,
  options,
  value,
  onChange,
  className,
}: ToggleButtonGroupProps) {
  const handleValueChange = (newValue: string) => {
    if (newValue && onChange) {
      onChange(newValue);
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
          {label}
        </label>
      )}
      <ToggleGroupPrimitive.Root
        type="single"
        value={value || options[0]}
        onValueChange={handleValueChange}
        className={cn(
          "inline-flex items-center justify-center rounded-lg bg-gray-100 p-1 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
          className
        )}
        aria-label={label || "Toggle selection"}
      >
        {options.map((option) => (
          <ToggleGroupPrimitive.Item
            key={option}
            value={option}
            className={cn(
              "inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
              "disabled:pointer-events-none disabled:opacity-50",
              "data-[state=on]:bg-white data-[state=on]:text-gray-900 data-[state=on]:shadow-sm",
              "dark:data-[state=on]:bg-gray-900 dark:data-[state=on]:text-gray-50",
              "hover:bg-gray-50 hover:text-gray-900 dark:hover:bg-gray-700 dark:hover:text-gray-50",
              "data-[state=on]:hover:bg-white dark:data-[state=on]:hover:bg-gray-900"
            )}
            aria-label={`Select ${option}`}
          >
            {option}
          </ToggleGroupPrimitive.Item>
        ))}
      </ToggleGroupPrimitive.Root>
    </div>
  );
}
