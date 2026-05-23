import React from "react";
import SettingsLayoutWrapper from "@/shared/components/layout/settings-layout-wrapper";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ groupId: string }>;
}

const GroupSettingsPage = async ({ params }: PageProps) => {
  const { groupId } = await params;
  if (!groupId) {
    notFound();
  }
  return <SettingsLayoutWrapper />;
};

export default GroupSettingsPage;
