"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/shared/components/ui/button";
import { useToast } from "@/shared/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface JoinGroupButtonProps {
  groupId: string;
  className?: string;
  /** When true, join API will not create a "Request Approved" notification (e.g. when joining via invite link). */
  viaInvite?: boolean;
}

export function JoinGroupButton({
  groupId,
  className,
  viaInvite = false,
}: JoinGroupButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleJoin = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(viaInvite ? { viaInvite: true } : {}),
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
      className={className ?? "rounded-full font-medium"}
      size="lg"
    >
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {isLoading ? "Joining..." : "Join group"}
    </Button>
  );
}
