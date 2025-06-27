"use client";

import React from "react";
import { UseFormReturn } from "react-hook-form";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { Switch } from "@/shared/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { MessageCircle } from "lucide-react";

interface CommunicationSectionProps {
  form: UseFormReturn<any>;
  onSubmit: (sectionId: string) => Promise<void>;
  isSubmitting: boolean;
}

export const CommunicationSection: React.FC<CommunicationSectionProps> = ({
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
          Communication Settings
        </h1>
        <p className="text-muted-foreground text-xs sm:text-sm max-w-2xl">
          Control how members can communicate within the group.
        </p>
      </div>
      <Card className="border-1 border-border bg-transparent">
        <CardContent className="space-y-3">
          {[
            {
              key: "groupChatEnabled",
              label: "Group Chat",
              description: "Enable group chat functionality",
            },
            {
              key: "allowDirectMessages",
              label: "Direct Messages",
              description: "Allow members to message each other privately",
            },
            {
              key: "notificationsEnabled",
              label: "Notifications",
              description: "Send notifications for group updates",
            },
            {
              key: "messageModeration",
              label: "Message Moderation",
              description: "Review messages before they&apos;re posted",
            },
          ].map((setting) => (
            <div
              key={setting.key}
              className="flex items-center justify-between py-2"
            >
              <div className="space-y-1">
                <Label className="text-xs font-medium">{setting.label}</Label>
                <p className="text-xs text-muted-foreground">
                  {setting.description}
                </p>
              </div>
              <Switch
                checked={
                  watchedValues.communicationSettings[
                    setting.key as keyof typeof watchedValues.communicationSettings
                  ]
                }
                onCheckedChange={(checked) =>
                  setValue(
                    `communicationSettings.${setting.key}` as any,
                    checked
                  )
                }
              />
            </div>
          ))}
        </CardContent>
        <CardContent className="pt-0">
          <Button
            type="button"
            onClick={() => onSubmit("communication")}
            disabled={isSubmitting}
            className="w-full h-9 text-sm"
          >
            {isSubmitting ? "Saving..." : "Save Communication Settings"}
          </Button>
        </CardContent>
      </Card>
    </>
  );
};
