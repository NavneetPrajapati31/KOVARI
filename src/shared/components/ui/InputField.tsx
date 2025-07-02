import { InputHTMLAttributes } from "react";
import { cn } from "@/shared/utils/utils";

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function InputField({
  label,
  error,
  className,
  ...props
}: InputFieldProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
        {label}
      </label>
      <input
        className={cn(
          "w-full rounded-md border border-gray-300 px-3 py-2 text-sm",
          "focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500",
          "dark:border-gray-600 dark:bg-gray-700 dark:text-white",
          error && "border-red-500 focus:border-red-500 focus:ring-red-500",
          className
        )}
        {...props}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
