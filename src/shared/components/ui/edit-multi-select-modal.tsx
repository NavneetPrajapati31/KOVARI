import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { X, Check } from "lucide-react";
import { Spinner } from "@heroui/react";
import { Badge } from "@/shared/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/shared/components/ui/command";

interface EditMultiSelectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  label: string;
  options: string[] | { id: string; label: string }[];
  value: string[];
  onSave: (value: string[]) => void;
  placeholder?: string;
}

export const EditMultiSelectModal: React.FC<EditMultiSelectModalProps> = ({
  open,
  onOpenChange,
  label,
  options,
  value,
  onSave,
  placeholder = "Search...",
}) => {
  const [selected, setSelected] = useState<string[]>(value || []);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setSelected(value || []);
  }, [value, open]);

  const toggleOption = (optionId: string) => {
    setSelected((prev) =>
      prev.includes(optionId)
        ? prev.filter((item) => item !== optionId)
        : [...prev, optionId]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await Promise.resolve(onSave(selected));
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const getOptionLabel = (option: string | { id: string; label: string }) => {
    return typeof option === "string" ? option : option.label;
  };

  const getOptionId = (option: string | { id: string; label: string }) => {
    return typeof option === "string" ? option : option.id;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-xs w-[95vw] sm:max-w-md md:max-w-lg mx-auto my-8 sm:my-12 rounded-2xl shadow-lg p-0 bg-card overflow-hidden"
        hideCloseButton
      >
        <div className="p-4 sm:p-6 border-b">
          <DialogTitle>
            <div className="flex items-center justify-between w-full">
              <span className="text-md font-semibold text-foreground truncate">
                Select {label}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="p-0 h-8 w-8 hover:bg-muted"
                disabled={isSaving}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </div>

        <div className="w-full">
          <Command className="rounded-none border-none">
            <CommandInput 
              placeholder={placeholder} 
              className="h-11 border-none focus:ring-0"
              autoFocus
            />
            <CommandList className="max-h-[300px]">
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                {options.map((option) => {
                  const id = getOptionId(option);
                  const label = getOptionLabel(option);
                  const isSelected = selected.includes(id);
                  return (
                    <CommandItem
                      key={id}
                      value={label}
                      onSelect={() => toggleOption(id)}
                      className="flex items-center justify-between py-3 px-4 cursor-pointer hover:bg-muted"
                    >
                      <span>{label}</span>
                      {isSelected && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>

        {selected.length > 0 && (
          <div className="p-4 border-t bg-muted/30">
            <div className="flex flex-wrap gap-2">
              {selected.map((id) => {
                const option = options.find((opt) => getOptionId(opt) === id);
                return (
                  <Badge
                    key={id}
                    variant="secondary"
                    className="flex items-center gap-1 bg-primary/10 text-primary border-none hover:bg-primary/20"
                  >
                    {option ? getOptionLabel(option) : id}
                    <button
                      onClick={() => toggleOption(id)}
                      className="ml-1 hover:text-destructive"
                      disabled={isSaving}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        <div className="p-4 sm:p-6 border-t flex justify-end gap-2 text-foreground">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
            className="rounded-lg h-9 px-4 text-foreground hover:bg-muted hover:text-foreground"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-lg h-9 px-4 bg-primary hover:bg-primary-hover text-white"
          >
            {isSaving ? (
              <Spinner
                variant="spinner"
                size="sm"
                classNames={{ spinnerBars: "bg-white" }}
              />
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditMultiSelectModal;
