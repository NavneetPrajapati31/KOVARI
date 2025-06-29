import React from "react";
import { UseFormReturn } from "react-hook-form";
import { ProfileEditForm } from "@/features/profile/lib/types";
import SectionRow from "@/features/profile/components/section-row";

interface PersonalSectionProps {
  form: UseFormReturn<ProfileEditForm>;
  isSubmitting: boolean;
  onSubmit: () => void;
}

const PersonalSection: React.FC<PersonalSectionProps> = ({ form }) => (
  <div className="w-full mx-auto p-4 space-y-6">
    {/* Header */}
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-foreground">
          Edit Personal Info
        </h1>
      </div>
      <p className="text-sm text-muted-foreground">
        Update your interests, languages, and bio.
      </p>
    </div>
    {/* Card Content */}
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
      <div className="font-semibold text-lg text-gray-900 mb-6">
        Personal Info
      </div>
      <div className="divide-y divide-gray-100">
        <SectionRow
          label="Interests"
          value={form.watch("interests")?.join(", ") || "-"}
          onEdit={() => {}}
        />
        <SectionRow
          label="Languages"
          value={form.watch("languages")?.join(", ") || "-"}
          onEdit={() => {}}
        />
        <SectionRow
          label="Bio"
          value={form.watch("bio") || "-"}
          onEdit={() => {}}
        />
      </div>
    </section>
  </div>
);

export default PersonalSection;
