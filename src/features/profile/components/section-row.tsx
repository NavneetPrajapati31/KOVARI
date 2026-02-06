import React, { useState, useRef, useEffect } from "react";
import { Pencil, Check, X, ChevronDown, Search } from "lucide-react";
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
import { DatePicker } from "@/shared/components/ui/date-picker";
import { LocationInput } from "@/shared/components/ui/location-input";
import { Avatar, Spinner } from "@heroui/react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/shared/components/ui/command";
import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/shared/utils/utils";

interface SectionRowProps {
  label: string;
  value: React.ReactNode;
  onEdit?: () => void;
  onSave?: (value: any) => Promise<any>;
  editLabel?: string;
  children?: React.ReactNode;
  fieldType?:
    | "text"
    | "number"
    | "select"
    | "textarea"
    | "date"
    | "multi-select"
    | "custom-select"
    | "location"
    | "popover-select"
    | "popover-multi-select";
  selectOptions?: { value: string; label: string }[];
  isLoading?: boolean;
  error?: string | null;
  placeholder?: string;
  min?: number;
  max?: number;
  maxLength?: number;
  editValue?: string | number | string[];
  isChecking?: boolean;
  startYear?: number;
  endYear?: number;
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
  editValue: controlledEditValue,
  isChecking = false,
  startYear,
  endYear,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState<any>(
    controlledEditValue !== undefined ? controlledEditValue : ""
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingField, setIsSavingField] = useState<string | null>(null);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (controlledEditValue !== undefined) {
      setEditValue(controlledEditValue);
    }
  }, [controlledEditValue]);

  const handleEdit = () => {
    setEditValue(
      controlledEditValue !== undefined
        ? controlledEditValue
        : typeof value === "string" || typeof value === "number"
          ? value
          : ""
    );
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!onSave) return;

    setIsSaving(true);
    try {
      const result = await onSave(editValue);
      // Only close if it doesn't return exactly false
      if (result !== false) {
        setIsEditing(false);
      }
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
    
  // Location autocomplete (OpenStreetMap Nominatim)
  useEffect(() => {
    if (fieldType !== "location") return;
    
    const controller = new AbortController();
    const query = (editValue as string || "").trim();
    
    if (!query) {
      setLocationSuggestions([]);
      return () => controller.abort();
    }

    // Don't fetch if the query exactly matches one of our suggestions (user just selected it)
    if (locationSuggestions.includes(query)) {
      return () => controller.abort();
    }

    const timeout = setTimeout(async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          query
        )}&format=json&addressdetails=1&limit=10`;
        const res = await fetch(url, {
          signal: controller.signal,
          headers: {
            Accept: "application/json",
            "Accept-Language": "en",
            "User-Agent": "Kovari/1.0 (onboarding@kovari.app)",
          },
        });
        if (!res.ok) return;
        const data = await res.json();
        const labels = data.map((d: any) => {
          const addr = d.address || {};
          const city =
            addr.city ||
            addr.town ||
            addr.village ||
            addr.hamlet ||
            addr.suburb ||
            "";
          const region = addr.state || addr.county || "";
          const country = addr.country || "";

          // Simplified label: prefer "City, Country".
          // If no city, fall back to "Region, Country".
          const main = city || region;
          const parts = [main, country].filter(Boolean);
          return parts.join(", ") || (d.display_name as string);
        });

        // De-duplicate by simplified label
        const seen = new Set<string>();
        const simplified: string[] = [];
        for (const label of labels) {
          if (!label || seen.has(label)) continue;
          seen.add(label);
          simplified.push(label);
          if (simplified.length >= 5) break;
        }

        setLocationSuggestions(simplified);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Location lookup error:", err);
        }
      }
    }, 300); // 300ms debounce

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [editValue, fieldType]);

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
        <Select value={editValue as string} onValueChange={setEditValue}>
          <SelectTrigger className="w-full h-9 text-sm focus:ring-0 rounded-lg bg-white">
            <SelectValue
              placeholder={placeholder || "Select an option"}
            />
          </SelectTrigger>
          <SelectContent className="p-1">
            {selectOptions.map((option) => (
              <SelectItem 
                key={option.value} 
                value={option.value}
                className="text-sm text-muted-foreground focus:bg-primary/5 focus:text-foreground hover:bg-secondary cursor-pointer"
              >
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
          value={editValue as string}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className={`w-full min-h-[80px] p-2 text-sm border rounded-lg resize-none focus:outline-none focus:ring-0 placeholder:text-sm bg-white ${
            error
              ? "border-destructive focus:border-destructive"
              : "border-input"
          }`}
          disabled={isSaving}
          placeholder={placeholder}
          maxLength={maxLength}
        />
      );
    }

    if (fieldType === "location") {
      return (
        <div className="relative w-full">
          <Input
            ref={inputRef}
            value={editValue as string || ""}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className={`w-full h-9 text-sm border-input focus:border-primary focus:ring-primary rounded-lg bg-white ${error ? "border-destructive focus:border-destructive" : ""} placeholder:text-muted-foreground`}
            disabled={isSaving}
            placeholder={placeholder || "Search your location"}
          />
          {locationSuggestions.length > 0 && (
            <div className="absolute z-50 mt-1 w-full rounded-lg border bg-popover shadow-lg max-h-60 overflow-y-auto">
              {locationSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm text-muted-foreground hover:bg-gray-100 transition-colors"
                  onClick={() => {
                    setEditValue(suggestion);
                    setLocationSuggestions([]);
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (fieldType === "date") {
      const parsedDate = editValue ? new Date(editValue as string) : null;
      const isValidDate = parsedDate && !isNaN(parsedDate.getTime());
      
      return (
        <div className="h-9 w-full">
          <DatePicker
            date={isValidDate ? (parsedDate as Date) : undefined}
            onDateChange={(selectedDate) => {
              if (selectedDate) {
                // Set to midday to avoid timezone shifts when converting to UTC ISO string
                const normalizedDate = new Date(selectedDate);
                normalizedDate.setHours(12, 0, 0, 0);
                setEditValue(normalizedDate.toISOString());
              } else {
                setEditValue("");
              }
            }}
            startYear={startYear}
            endYear={endYear}
          />
        </div>
      );
    }

    if (fieldType === "popover-select" || fieldType === "popover-multi-select") {
      const isMulti = fieldType === "popover-multi-select";
      const currentValues = isMulti ? (editValue as string[]) || [] : [];
      const selectedLabel = !isMulti 
        ? selectOptions.find(opt => opt.value === editValue)?.label || editValue as string
        : "";

      return (
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              disabled={isSaving}
              className="w-full h-9 text-sm border-input justify-between font-normal bg-white hover:bg-white px-3 py-2 rounded-lg"
            >
                <span className={cn(!editValue && "text-muted-foreground", "truncate")}>
                  {isMulti 
                    ? (currentValues.length > 0 ? `${currentValues.length} selected` : placeholder || "Select options...")
                    : (editValue ? selectedLabel : placeholder || "Select option...")
                  }
                </span>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0 border border-border shadow-xl rounded-xl overflow-hidden bg-white" align="start" sideOffset={4}>
            <Command className="w-[280px] sm:w-[320px]">
              <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
                <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                <input
                  placeholder={placeholder || "Search..."}
                  className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <CommandList className="max-h-[300px]">
                {selectOptions.filter(opt => 
                  opt.label.toLowerCase().includes(searchQuery.toLowerCase())
                ).length === 0 && (
                  <div className="py-6 text-center text-sm">No results found.</div>
                )}
                <CommandGroup className="max-h-64 overflow-auto hide-scrollbar">
                  {selectOptions
                    .filter(opt => opt.label.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((option) => {
                      const isSelected = isMulti 
                        ? currentValues.includes(option.value)
                        : editValue === option.value;
                      
                      return (
                        <div
                          key={option.value}
                          className="px-2 py-1.5 text-sm text-muted-foreground rounded-sm cursor-pointer hover:bg-gray-100 flex items-center group"
                          onClick={async () => {
                            if (isMulti) {
                              const next = currentValues.includes(option.value)
                                ? currentValues.filter((v) => v !== option.value)
                                : [...currentValues, option.value];
                              setEditValue(next);
                              onSave?.(next);
                            } else {
                              setEditValue(option.value);
                              // Close popover only AFTER save
                              setIsSaving(true);
                              try {
                                await onSave?.(option.value);
                                setIsPopoverOpen(false);
                                setIsEditing(false);
                              } finally {
                                setIsSaving(false);
                              }
                            }
                          }}
                        >
                          <div className="mr-2 h-4 w-4 flex items-center justify-center flex-shrink-0">
                            {isSelected && (
                              <Check className="h-4 w-4 text-foreground" />
                            )}
                          </div>
                          <span className={cn(isSelected ? "text-foreground font-medium" : "text-muted-foreground")}>
                            {option.label}
                          </span>
                        </div>
                      );
                    })}
                </CommandGroup>
              </CommandList>
                {isMulti && currentValues.length > 0 && (
                  <div className="p-4 border-t bg-muted/30">
                    <div className="flex flex-wrap gap-1">
                      {currentValues.map(val => (
                        <Badge 
                          key={val} 
                          variant="secondary" 
                          className="bg-secondary text-foreground transition-colors border-none px-4 py-2 text-xs"
                        >
                          {val}
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              const next = currentValues.filter(v => v !== val);
                              setEditValue(next);
                              onSave?.(next);
                            }}
                            className="ml-2"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
            </Command>
          </PopoverContent>
        </Popover>
      );
    }

    return (
      <div className="relative w-full">
        <Input
          ref={inputRef}
          type={fieldType === "custom-select" ? "text" : fieldType}
          value={editValue as string}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className={`w-full h-9 text-sm border-input focus:border-primary focus:ring-primary rounded-lg bg-white ${error ? "border-destructive focus:border-destructive" : ""} placeholder:text-muted-foreground pr-9`}
          disabled={isSaving}
          placeholder={placeholder}
          min={min}
          max={max}
          maxLength={maxLength}
        />
        {/* {isChecking && (
          <div className="absolute right-3 top-0 h-full flex items-center">
            <Spinner
              variant="spinner"
              size="sm"
              classNames={{ spinnerBars: "bg-primary" }}
            />
          </div>
        )} */}
      </div>
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
              <div className="flex-1 min-w-0">{renderEditField()}</div>
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
                    {isSaving ? (
                       <Spinner variant="spinner" size="sm" classNames={{ spinnerBars: "bg-primary-foreground" }} />
                    ) : (
                      <Check className="w-3 h-3" />
                    )}
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
              <div className="flex gap-2 items-center justify-end">
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
                  {isSaving ? (
                    <Spinner variant="spinner" size="sm" classNames={{ spinnerBars: "bg-primary-foreground" }} />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
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
