import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { X, Check } from "lucide-react";
import { Spinner } from "@heroui/react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/shared/components/ui/command";

interface EditSelectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  label: string;
  options: string[];
  value: string;
  onSave: (value: string) => void;
  placeholder?: string;
}

export const EditSelectModal: React.FC<EditSelectModalProps> = ({
  open,
  onOpenChange,
  label,
  options,
  value,
  onSave,
  placeholder = "Search...",
}) => {
  const [selected, setSelected] = useState(value);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setSelected(value);
  }, [value, open]);

  const handleSave = async (option?: string) => {
    const valueToSave = option !== undefined ? option : selected;
    if (!valueToSave) return;

    setIsSaving(true);
    try {
      await Promise.resolve(onSave(valueToSave));
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving:", error);
    } finally {
      setIsSaving(false);
    }
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
                {options.map((option) => (
                  <CommandItem
                    key={option}
                    value={option}
                    onSelect={() => {
                      setSelected(option);
                      handleSave(option);
                    }}
                    className="flex items-center justify-between py-3 px-4 cursor-pointer hover:bg-muted"
                  >
                    <span>{option}</span>
                    {option === selected && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>

        {isSaving && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-50">
            <Spinner
              variant="spinner"
              size="lg"
              classNames={{ spinnerBars: "bg-primary" }}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EditSelectModal;
