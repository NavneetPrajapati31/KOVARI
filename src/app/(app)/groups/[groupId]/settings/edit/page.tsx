"use client";

import React from "react";
import { Badge } from "@/shared/components/ui/badge";

export default function EditPage() {
  return (
    <div className="w-full mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-foreground">
            Edit Group Settings
          </h1>
          <Badge variant="outline" className="text-xs">
            Public
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Customize your group&apos;s information, privacy, and travel
          preferences using the sidebar navigation.
        </p>
      </div>

      {/* Content will be handled by the layout wrapper */}
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">
          Select a section from the sidebar to get started
        </p>
      </div>
    </div>
  );
}
