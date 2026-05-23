import FollowersFollowing from "@/features/profile/components/followers-following";
import React from "react";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ userId: string }>;
}

export default async function page({ params }: PageProps) {
  const { userId } = await params;
  if (!userId) {
    notFound();
  }
  return (
    <>
      <FollowersFollowing />
    </>
  );
}
