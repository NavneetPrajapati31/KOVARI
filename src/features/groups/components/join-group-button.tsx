"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/shared/components/ui/button";
import { useToast } from "@/shared/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface JoinGroupButtonProps {
  groupId: string;
}

export function JoinGroupButton({ groupId }: JoinGroupButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleJoin = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/join`, {
        method: "POST",
      });

      if (!res.ok) {
        throw new Error("Failed to join group");
      }

      toast({
        title: "Success!",
        description: "You have joined the group.",
      });

      router.push(`/groups/${groupId}/home`);
      router.refresh();
    } catch (error) {
      console.error("Error joining group:", error);
      toast({
        title: "Error",
        description: "Could not join the group. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleJoin}
      disabled={isLoading}
      className="bg-blue-600 text-white px-6 py-2 rounded font-semibold hover:bg-blue-700 transition"
    >
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Join Group
    </Button>
  );
}
