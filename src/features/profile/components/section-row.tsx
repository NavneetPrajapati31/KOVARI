import React, { useState, useRef, useEffect } from "react";
import { Pencil, Check, X } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { useIsMobile } from "@/shared/hooks/use-mobile";

interface SectionRowProps {
  label: string;
  value: React.ReactNode;
  onEdit?: () => void;
  onSave?: (value: string | number) => Promise<void>;
  editLabel?: string;
  children?: React.ReactNode;
  fieldType?: "text" | "number" | "select" | "textarea";
  selectOptions?: { value: string; label: string }[];
  isLoading?: boolean;
  error?: string | null;
  placeholder?: string;
  min?: number;
  max?: number;
  maxLength?: number;
}

const SectionRow: React.FC<SectionRowProps> = ({
  label,
  value,
  onEdit,
  onSave,
  editLabel = "Edit",
  children,
  fieldType = "text",
  selectOptions = [],
  isLoading = false,
  error,
  placeholder,
  min,
  max,
  maxLength,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleEdit = () => {
    setEditValue(String(value));
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!onSave) return;

    setIsSaving(true);
    try {
      await onSave(editValue);
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  const renderEditField = () => {
    if (fieldType === "select") {
      return (
        <Select value={editValue} onValueChange={setEditValue}>
          <SelectTrigger className="w-full">
            <SelectValue
              placeholder={placeholder || "Select an option"}
              className="text-sm"
            />
          </SelectTrigger>
          <SelectContent>
            {selectOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    if (fieldType === "textarea") {
      return (
        <textarea
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className={`w-full min-h-[80px] p-2 text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-sm ${
            error
              ? "border-destructive focus:border-destructive"
              : "border-input focus:border-primary"
          }`}
          disabled={isSaving}
          placeholder={placeholder}
          maxLength={maxLength}
        />
      );
    }

    return (
      <Input
        ref={inputRef}
        type={fieldType}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className={`w-full h-8 ${error ? "border-destructive focus:border-destructive" : ""} placeholder:text-sm`}
        disabled={isSaving}
        placeholder={placeholder}
        min={min}
        max={max}
        maxLength={maxLength}
      />
    );
  };

  return (
    <div
      className={`flex items-start justify-between py-3 border-b last:border-b-0 ${isMobile ? "px-0" : ""}`}
    >
      <div className="flex-1">
        <div
          className={`font-semibold text-foreground ${isMobile ? "text-sm mb-1" : "text-sm mb-1"}`}
        >
          {label}
        </div>
        {isEditing ? (
          <div className="space-y-2">
            <div
              className={
                fieldType === "textarea"
                  ? "space-y-2"
                  : `flex gap-2 items-center`
              }
            >
              {renderEditField()}
              {fieldType !== "textarea" && (
                <>
                  <Button
                    size={isMobile ? "icon" : "sm"}
                    onClick={handleSave}
                    disabled={isSaving}
                    className={
                      isMobile
                        ? "bg-primary text-primary-foreground text-xs"
                        : "bg-primary text-xs text-primary-foreground"
                    }
                    aria-label="Save"
                  >
                    <Check className="w-3 h-3" />
                  </Button>
                  <Button
                    size={isMobile ? "icon" : "sm"}
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isSaving}
                    className={isMobile ? "text-xs" : "text-xs"}
                    aria-label="Cancel"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </>
              )}
            </div>
            {fieldType === "textarea" && (
              <div className="flex gap-2 items-center">
                <Button
                  size={isMobile ? "icon" : "sm"}
                  onClick={handleSave}
                  disabled={isSaving}
                  className={
                    isMobile
                      ? "bg-primary text-primary-foreground p-2"
                      : "bg-primary text-xs text-primary-foreground"
                  }
                  aria-label="Save"
                >
                  <Check className="w-4 h-4" />
                </Button>
                <Button
                  size={isMobile ? "icon" : "sm"}
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSaving}
                  className={isMobile ? "p-2" : "text-xs"}
                  aria-label="Cancel"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
            {error && (
              <div className="text-destructive text-xs mt-1">{error}</div>
            )}
          </div>
        ) : (
          <div className="text-muted-foreground text-sm whitespace-pre-line font-medium">
            {value}
          </div>
        )}
        {children}
      </div>
      {!isEditing && (onEdit || onSave) && (
        <button
          type="button"
          onClick={onSave ? handleEdit : onEdit}
          disabled={isLoading}
          className={`ml-4 border border-border rounded-lg text-muted-foreground hover:bg-gray-200 transition-all duration-300 flex items-center ${isMobile ? "p-2" : "px-3 py-1.5 gap-1 text-xs font-semibold"} disabled:opacity-50`}
          aria-label={editLabel}
        >
          <Pencil className="w-4 h-4" />
          {!isMobile && editLabel}
        </button>
      )}
    </div>
  );
};

export default SectionRow;
