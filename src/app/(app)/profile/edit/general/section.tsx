import React from "react";
import { UseFormReturn } from "react-hook-form";
import { Upload, Trash2 } from "lucide-react";
import { ProfileEditForm } from "@/features/profile/lib/types";
import SectionRow from "@/features/profile/components/section-row";

interface GeneralSectionProps {
  form: UseFormReturn<ProfileEditForm>;
  isSubmitting: boolean;
  onSubmit: () => void;
}

const GeneralSection: React.FC<GeneralSectionProps> = ({ form }) => (
  <div className="w-full mx-auto p-4 space-y-6">
    {/* Header */}
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-foreground">
          Edit General Info
        </h1>
      </div>
      <p className="text-sm text-muted-foreground">
        Update your basic profile details.
      </p>
    </div>
    {/* Card Content */}
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
      <div className="flex items-center gap-6 mb-8">
        <div className="relative">
          <img
            src={form.watch("avatar") || "/default-avatar.png"}
            alt="Avatar"
            className="w-20 h-20 rounded-full object-cover border"
          />
          <button
            type="button"
            className="absolute bottom-0 right-0 bg-white border border-gray-200 rounded-full p-1 shadow hover:bg-gray-50"
            aria-label="Upload avatar"
          >
            <Upload className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <div className="flex flex-col gap-2">
          <div className="font-semibold text-lg text-gray-900">
            {form.watch("name")}
          </div>
          <div className="text-gray-500 text-sm">@{form.watch("username")}</div>
        </div>
        <button
          type="button"
          className="ml-auto border border-gray-200 rounded-lg p-2 text-red-500 hover:bg-red-50"
          aria-label="Delete avatar"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      <div className="divide-y divide-gray-100">
        <SectionRow label="Name" value={form.watch("name")} onEdit={() => {}} />
        <SectionRow
          label="Username"
          value={form.watch("username")}
          onEdit={() => {}}
        />
        <SectionRow label="Age" value={form.watch("age")} onEdit={() => {}} />
        <SectionRow
          label="Gender"
          value={form.watch("gender")}
          onEdit={() => {}}
        />
        <SectionRow
          label="Nationality"
          value={form.watch("nationality")}
          onEdit={() => {}}
        />
      </div>
    </section>
  </div>
);

export default GeneralSection;
