import React from "react";
import { Pencil } from "lucide-react";

interface SectionRowProps {
  label: string;
  value: React.ReactNode;
  onEdit?: () => void;
  editLabel?: string;
  children?: React.ReactNode;
}

const SectionRow: React.FC<SectionRowProps> = ({
  label,
  value,
  onEdit,
  editLabel = "Edit",
  children,
}) => (
  <div className="flex items-start justify-between py-4 border-b last:border-b-0">
    <div>
      <div className="font-semibold text-gray-900 text-sm mb-1">{label}</div>
      <div className="text-gray-700 text-sm whitespace-pre-line">{value}</div>
      {children}
    </div>
    {onEdit && (
      <button
        type="button"
        onClick={onEdit}
        className="ml-4 px-3 py-1.5 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-1 text-xs font-medium"
        aria-label={editLabel}
      >
        <Pencil className="w-4 h-4" /> {editLabel}
      </button>
    )}
  </div>
);

export default SectionRow;
