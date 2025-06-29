import React from "react";
import { UseFormReturn } from "react-hook-form";
import { ProfileEditForm } from "@/features/profile/lib/types";
import SectionRow from "@/features/profile/components/section-row";

interface ProfessionalSectionProps {
  form: UseFormReturn<ProfileEditForm>;
  isSubmitting: boolean;
  onSubmit: () => void;
}

const ProfessionalSection: React.FC<ProfessionalSectionProps> = ({ form }) => (
  <div className="w-full mx-auto p-4 space-y-6">
    {/* Header */}
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-foreground">
          Edit Professional Info
        </h1>
      </div>
      <p className="text-sm text-muted-foreground">
        Update your professional details.
      </p>
    </div>
    {/* Card Content */}
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
      <div className="font-semibold text-lg text-gray-900 mb-6">
        Professional Info
      </div>
      <div className="divide-y divide-gray-100">
        <SectionRow
          label="Profession"
          value={form.watch("profession") || "-"}
          onEdit={() => {}}
        />
      </div>
    </section>
  </div>
);

export default ProfessionalSection;
