"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@heroui/react";

export function AcceptInviteClient({
  token,
  groupId,
}: {
  token: string;
  groupId: string;
}) {
  const router = useRouter();

  useEffect(() => {
    async function acceptInvite() {
      try {
        const res = await fetch("/api/group-invitation/accept", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
          credentials: "include",
        });
        if (res.ok) {
          router.replace(`/groups/${groupId}/home`);
        } else {
          const errorText = await res.text();
          // Show error in alert for now
          alert("Invite Error: " + errorText);
        }
      } catch (e) {
        alert("Invite Error: " + (e instanceof Error ? e.message : String(e)));
      }
    }
    acceptInvite();
  }, [token, groupId, router]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-card">
      {/* <Loader2 className="w-11 h-11 animate-spin text-black" /> */}
      <Spinner variant="spinner" size="md" color="primary" />
    </div>
  );
}
