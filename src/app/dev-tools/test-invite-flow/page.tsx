"use client";

import { InviteConfirmationModal } from "@/features/invite/components/InviteModal";
import { InviteTeammatesModal } from "@/features/invite/components/invite-teammember";
import React from "react";

const mockTraveler = {
  id: "1",
  name: "Test User",
  email: "test@example.com",
  location: "Test City",
  avatar: undefined,
};

export default function Page() {
  return (
    <InviteTeammatesModal
      open={true}
      onOpenChange={() => {}}
      groupId="ac758d01-c4a4-4fa8-99d8-0963190dc43c"
    />
  );
}
