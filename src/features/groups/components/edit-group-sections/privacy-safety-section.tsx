"use client";

import React, { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { Switch } from "@/shared/components/ui/switch";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Flag } from "lucide-react";
import { useParams } from "next/navigation";
import { ReportDialog } from "@/shared/components/ReportDialog";
import { useReportStatus } from "@/shared/hooks/useReportStatus";

interface PrivacySafetySectionProps {
  form: UseFormReturn<any>;
  onSubmit: (sectionId: string) => Promise<void>;
  isSubmitting: boolean;
}

export const PrivacySafetySection: React.FC<PrivacySafetySectionProps> = ({
  form,
  onSubmit,
  isSubmitting,
}) => {
  const { setValue, watch } = form;

  const watchedValues = watch();
  const params = useParams<{ groupId: string }>();
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [groupInfo, setGroupInfo] = useState<{ name?: string } | null>(null);

  const { hasReported, setHasReported } = useReportStatus(params.groupId, "group");

  // Fetch group info for report dialog
  React.useEffect(() => {
    const fetchGroupInfo = async () => {
      try {
        const response = await fetch(`/api/groups/${params.groupId}`);
        if (!response.ok) throw new Error("Failed to fetch group info");
        const data = await response.json();
        setGroupInfo(data);
      } catch (err) {
        console.error("Failed to fetch group info:", err);
      }
    };
    if (params.groupId) {
      fetchGroupInfo();
    }
  }, [params.groupId]);

  return (
    <>
      <div className="space-y-1 mb-5">
        <h1 className="text-md font-semibold text-foreground">Privacy & Safety</h1>
        <p className="text-muted-foreground text-xs sm:text-sm max-w-2xl">
          Control who can see and join your group.
        </p>
      </div>
      <div className="space-y-3 w-full max-w-full pb-4">
        <Card className="border-1 border-border bg-transparent w-full max-w-full min-w-0">
          <CardContent className="space-y-4 w-full max-w-full min-w-0">
            <div className="flex flex-row sm:flex-row sm:items-center sm:justify-between gap-3 py-2 border-none pt-0 min-w-0">
              <div className="space-y-1 flex-1">
                <Label className="text-xs font-medium">Group Privacy</Label>
                <p className="text-xs text-muted-foreground">
                  {watchedValues.visibility === "public"
                    ? "Your group is visible to everyone"
                    : "Your group is private and invitation-only"}
                </p>
              </div>
              <Switch
                checked={watchedValues.visibility === "public"}
                disabled={isSubmitting}
                onCheckedChange={async (checked) => {
                  setValue("visibility", checked ? "public" : "private", {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                  await onSubmit("privacy");
                }}
              />
            </div>
            
            <div className="flex flex-row sm:flex-row sm:items-center sm:justify-between gap-3 py-2 border-none pt-0 min-w-0">
              <div className="space-y-1 flex-1">
                <Label className="text-xs font-medium">Strictly Non-Smoking</Label>
                <p className="text-xs text-muted-foreground">
                  Only allow non-smokers to join.
                </p>
              </div>
              <Switch
                checked={watchedValues.strictlyNonSmoking}
                disabled={isSubmitting}
                onCheckedChange={async (checked) => {
                  setValue("strictlyNonSmoking", checked, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                  await onSubmit("privacy");
                }}
              />
            </div>

            <div className="flex flex-row sm:flex-row sm:items-center sm:justify-between gap-3 py-2 border-none pt-0 min-w-0">
              <div className="space-y-1 flex-1">
                <Label className="text-xs font-medium">Strictly Non-Drinking</Label>
                <p className="text-xs text-muted-foreground">
                  Only allow non-drinkers to join.
                </p>
              </div>
              <Switch
                checked={watchedValues.strictlyNonDrinking}
                disabled={isSubmitting}
                onCheckedChange={async (checked) => {
                  setValue("strictlyNonDrinking", checked, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                  await onSubmit("privacy");
                }}
              />
            </div>

            <div className="border-t border-border pt-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 min-w-0">
                <div className="space-y-1 flex-1 min-w-0">
                  <Label className="text-xs font-medium">Report group</Label>
                  <p className="text-xs text-muted-foreground">
                    Flag this group if it violates community guidelines.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsReportDialogOpen(true)}
                  className={`h-8 rounded-3xl text-sm border-border sm:w-auto w-full ${
                    hasReported
                      ? "bg-background text-foreground pointer-events-none"
                      : "bg-background text-foreground hover:text-foreground hover:bg-destructive/10"
                  }`}
                >
                  {hasReported ? "Reported" : "Report"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <ReportDialog
          open={isReportDialogOpen}
          onOpenChange={setIsReportDialogOpen}
          targetType="group"
          targetId={params.groupId || ""}
          targetName={groupInfo?.name}
          onSuccess={() => setHasReported(true)}
        />
      </div>
    </>
  );
};
