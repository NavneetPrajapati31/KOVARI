import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { groupFormSchema } from "@/features/groups/lib/validation/groupFormSchema";
import { z } from "zod";
import { InputField } from "@/shared/components/ui/InputField";
import { DatePicker } from "@/shared/components/ui/DatePicker";
import { ToggleButtonGroup } from "@/shared/components/ui/ToggleButtonGroup";
import { TextAreaField } from "@/shared/components/ui/TextAreaField";
import { useToast } from "@/shared/hooks/use-toast";
import { useRouter } from "next/navigation";

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

  const { toast } = useToast();
  const router = useRouter();

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        name: data.groupName,
        destination: data.destination,
        start_date: data.startDate.split('T')[0],
        end_date: data.endDate.split('T')[0],
        is_public: data.visibility === "public",
        description: data.description,
      };

      const res = await fetch("/api/create-group", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create group");
      }

      const newGroup = await res.json();
      toast({ title: "Success", description: "Group created successfully!" });
      router.push(`/groups/${newGroup.id}/home`);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Something went wrong", variant: "destructive" });
    }
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

