"use client";

import React from "react";
import { UseFormReturn } from "react-hook-form";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { Switch } from "@/shared/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Shield, AlertTriangle, Globe, Lock, Users } from "lucide-react";

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
  const {
    setValue,
    watch,
    formState: { errors },
  } = form;

  const watchedValues = watch();

  return (
    <>
      <div className="space-y-2 mb-6">
        <h1 className="text-md sm:text-lg font-bold text-foreground">
          Privacy & Safety
        </h1>
        <p className="text-muted-foreground text-xs sm:text-sm max-w-2xl">
          Control who can see and join your group.
        </p>
      </div>
      <div className="space-y-4 w-full max-w-full">
        <Card className="border-1 border-border bg-transparent w-full max-w-full min-w-0">
          <CardContent className="space-y-4 w-full max-w-full min-w-0">
            <div className="space-y-2">
              <Label htmlFor="visibility" className="text-xs font-medium">
                Group Visibility
              </Label>
              <Select
                onValueChange={(value) => setValue("visibility", value as any)}
                defaultValue={watchedValues.visibility}
              >
                <SelectTrigger className="h-9 text-xs w-full min-w-0">
                  <span className="truncate overflow-hidden whitespace-nowrap block w-full min-w-0">
                    <SelectValue placeholder="Select visibility" />
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">
                    <div className="flex items-center gap-2">
                      <Globe className="h-3 w-3" />
                      Public
                    </div>
                  </SelectItem>
                  <SelectItem value="private">
                    <div className="flex items-center gap-2">
                      <Lock className="h-3 w-3" />
                      Private
                    </div>
                  </SelectItem>
                  <SelectItem value="invite-only">
                    <div className="flex items-center gap-2">
                      <Users className="h-3 w-3" />
                      Invite-only
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-row sm:flex-row sm:items-center sm:justify-between gap-3 py-2 border-t pt-4 min-w-0">
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
                onCheckedChange={(checked) =>
                  setValue("visibility", checked ? "public" : "private")
                }
              />
            </div>

            <div className="space-y-3 min-w-0">
              <div className="flex flex-row sm:flex-row sm:items-center sm:justify-between gap-3 py-2 min-w-0">
                <div className="space-y-1 flex-1">
                  <Label className="text-xs font-medium">
                    Allow Join Requests
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Let people request to join your group
                  </p>
                </div>
                <Switch
                  checked={watchedValues.allowJoinRequests}
                  onCheckedChange={(checked) =>
                    setValue("allowJoinRequests", checked)
                  }
                />
              </div>

              <div className="flex flex-row sm:flex-row sm:items-center sm:justify-between gap-3 py-2 min-w-0">
                <div className="space-y-1 flex-1">
                  <Label className="text-xs font-medium">
                    Require Approval
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Manually approve new members
                  </p>
                </div>
                <Switch
                  checked={watchedValues.requireApproval}
                  onCheckedChange={(checked) =>
                    setValue("requireApproval", checked)
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-1 border-border bg-transparent w-full max-w-full min-w-0">
          <CardHeader className="pb-4 w-full max-w-full min-w-0">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Safety Features
            </CardTitle>
            <CardDescription className="text-xs">
              Enable safety features to protect group members.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 w-full max-w-full min-w-0">
            {[
              {
                key: "emergencyContacts",
                label: "Emergency Contacts",
                description: "Allow members to share emergency contacts",
              },
              {
                key: "locationSharing",
                label: "Location Sharing",
                description: "Enable real-time location sharing during trips",
              },
              {
                key: "panicButton",
                label: "Panic Button",
                description: "Quick emergency alert system",
              },
              {
                key: "memberVerification",
                label: "Member Verification",
                description: "Require identity verification for new members",
              },
              {
                key: "reportSystem",
                label: "Report System",
                description: "Allow members to report issues",
              },
            ].map((feature) => (
              <div
                key={feature.key}
                className="flex flex-row sm:flex-row sm:items-center sm:justify-between gap-3 py-2 min-w-0"
              >
                <div className="space-y-1 flex-1">
                  <Label className="text-xs font-medium">{feature.label}</Label>
                  <p className="text-xs text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
                <Switch
                  checked={
                    watchedValues.safetyFeatures[
                      feature.key as keyof typeof watchedValues.safetyFeatures
                    ]
                  }
                  onCheckedChange={(checked) =>
                    setValue(`safetyFeatures.${feature.key}` as any, checked)
                  }
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Button
          type="button"
          onClick={() => onSubmit("privacy")}
          disabled={isSubmitting}
          className="w-full h-9 text-sm"
        >
          {isSubmitting ? "Saving..." : "Save Privacy Settings"}
        </Button>
      </div>
    </>
  );
};
