import { useState, useEffect } from "react";
import { ProfileEditForm } from "@/features/profile/lib/types";
import { useToast } from "@/shared/hooks/use-toast";

export const useProfileData = () => {
  const [profileData, setProfileData] = useState<ProfileEditForm | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const fetchProfileData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/profile/current");
      if (response.ok) {
        const data = await response.json();
        setProfileData(data);
        return data;
      } else {
        console.error("Failed to fetch profile data");
        toast({
          title: "Error",
          description: "Failed to load profile data",
          variant: "destructive",
        });
        return null;
      }
    } catch (error) {
      console.error("Error fetching profile data:", error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfileField = async (
    field: keyof ProfileEditForm,
    value: string | number | string[]
  ) => {
    try {
      setIsUpdating(true);
      const response = await fetch("/api/profile/update", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          field,
          value,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        // Update local state
        setProfileData((prev) => (prev ? { ...prev, [field]: value } : null));

        toast({
          title: "Success",
          description: `${field} updated successfully`,
        });

        return result;
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to update field");
      }
    } catch (error) {
      console.error(`Error updating ${field}:`, error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update field",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  return {
    profileData,
    isLoading,
    isUpdating,
    fetchProfileData,
    updateProfileField,
  };
};
