import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { X, Loader2 } from "lucide-react";
import {
  Select,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectContent,
} from "@/shared/components/ui/select";
import { Spinner } from "@heroui/react";

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
  placeholder = "Select...",
}) => {
  const [selected, setSelected] = useState(value);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setSelected(value);
  }, [value, open]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await Promise.resolve(onSave(selected));
      onOpenChange(false);
    } catch (error) {
      // Optionally handle error (e.g., show toast)
      // For now, just stop saving
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-xs w-[95vw] sm:max-w-md md:max-w-lg mx-auto my-8 sm:my-12 rounded-2xl shadow-lg p-4 sm:p-8 bg-card"
        hideCloseButton
      >
        <DialogTitle>
          <div className="flex items-center justify-between w-full">
            <span className="text-md font-semibold text-foreground truncate">
              Edit {label}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="p-0 has-[svg]:px-0  hover:bg-transparent text-foreground hover:text-foreground"
              aria-label="Close modal"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogTitle>
        <div className="mb-1 w-full">
          <Select
            value={selected}
            onValueChange={setSelected}
            aria-label={`Select ${label}`}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent className="max-h-60 overflow-y-auto">
              {options.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex justify-end gap-2 w-full mt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="min-w-[100px] px-5 py-1"
            aria-label="Cancel"
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            className="min-w-[100px] px-5 py-1 flex items-center justify-center"
            aria-label="Save"
            disabled={!selected || selected === value || isSaving}
          >
            {isSaving ? (
              <Spinner
                variant="spinner"
                size="sm"
                classNames={{ spinnerBars: "bg-white" }}
              />
            ) : (
              "Save"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditSelectModal;
