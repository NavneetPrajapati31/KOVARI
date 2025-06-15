import { TextareaHTMLAttributes } from "react"
import { cn } from "@/lib/utils"

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
  showCharCount?: boolean
}

export function TextAreaField({ 
  label, 
  error, 
  className, 
  showCharCount,
  maxLength,
  ...props 
}: TextAreaFieldProps) {
  const charCount = props.value?.toString().length || 0

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
        {label}
      </label>
      <textarea
        className={cn(
          "w-full rounded-md border border-gray-300 px-3 py-2 text-sm",
          "focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500",
          "dark:border-gray-600 dark:bg-gray-700 dark:text-white",
          error && "border-red-500 focus:border-red-500 focus:ring-red-500",
          className
        )}
        maxLength={maxLength}
        {...props}
      />
      <div className="flex justify-between">
        {error && <p className="text-sm text-red-500">{error}</p>}
        {showCharCount && maxLength && (
          <p className="text-sm text-gray-500">
            {charCount}/{maxLength}
          </p>
        )}
      </div>
    </div>
  )
} 