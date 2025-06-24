import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { groupFormSchema } from "@/features/groups/lib/validation/groupFormSchema";
import { z } from "zod";
import { InputField } from "@/shared/components/ui/InputField";
import { DatePicker } from "@/shared/components/ui/DatePicker";
import { ToggleButtonGroup } from "@/shared/components/ui/ToggleButtonGroup";
import { TextAreaField } from "@/shared/components/ui/TextAreaField";

type FormData = z.infer<typeof groupFormSchema>;

export function GroupForm() {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(groupFormSchema),
    defaultValues: {
      groupName: "",
      destination: "",
      startDate: "",
      endDate: "",
      visibility: "public",
      description: "",
    },
  });

  const onSubmit = (data: FormData) => {
    console.log("Group Form Data:", data);
    // TODO: Send to Supabase or API
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Group Name */}
      <InputField
        label="Group Name"
        {...register("groupName")}
        error={errors.groupName?.message}
      />

      {/* Destination */}
      <InputField
        label="Destination"
        {...register("destination")}
        error={errors.destination?.message}
      />

      {/* Date Pickers */}
      <Controller
        name="startDate"
        control={control}
        render={({ field }) => (
          <DatePicker
            label="Start Date"
            value={field.value}
            onDateChange={field.onChange}
            error={errors.startDate?.message}
          />
        )}
      />

      <Controller
        name="endDate"
        control={control}
        render={({ field }) => (
          <DatePicker
            label="End Date"
            value={field.value}
            onDateChange={field.onChange}
            error={errors.endDate?.message}
          />
        )}
      />

      {/* Visibility Toggle */}
      <Controller
        name="visibility"
        control={control}
        render={({ field }) => (
          <ToggleButtonGroup
            label="Visibility"
            options={["public", "private"]}
            value={field.value}
            onChange={field.onChange}
          />
        )}
      />

      {/* Description */}
      <TextAreaField
        label="Description"
        maxLength={500}
        {...register("description")}
        error={errors.description?.message}
        showCharCount
      />

      {/* Submit Button */}
      <button type="submit" className="btn btn-primary w-full">
        Create Group
      </button>
    </form>
  );
}
