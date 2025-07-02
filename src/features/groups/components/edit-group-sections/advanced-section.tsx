"use client";

import React from "react";
import { UseFormReturn } from "react-hook-form";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Zap } from "lucide-react";

interface AdvancedSectionProps {
  form: UseFormReturn<any>;
  onSubmit: (sectionId: string) => Promise<void>;
  isSubmitting: boolean;
}

export const AdvancedSection: React.FC<AdvancedSectionProps> = ({
  form,
  onSubmit,
  isSubmitting,
}) => {
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <>
      <div className="space-y-2 mb-6">
        <h1 className="text-md sm:text-lg font-bold text-foreground">
          Advanced Settings
        </h1>
        <p className="text-muted-foreground text-xs sm:text-sm max-w-2xl">
          Additional group rules and advanced configurations.
        </p>
      </div>
      <Card className="border-1 border-border bg-transparent">
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rules" className="text-xs font-medium">
              Group Rules
            </Label>
            <Textarea
              id="rules"
              {...register("rules")}
              placeholder="Set clear rules for group members..."
              className="min-h-[100px] text-sm resize-none"
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground">
              Establish guidelines for behavior, expectations, and group
              dynamics.
            </p>
            {errors.rules && (
              <p className="text-xs text-destructive">
                {errors.rules.message?.toString()}
              </p>
            )}
          </div>
        </CardContent>
        <CardContent className="pt-0">
          <Button
            type="button"
            onClick={() => onSubmit("advanced")}
            disabled={isSubmitting}
            className="w-full h-9 text-sm"
          >
            {isSubmitting ? "Saving..." : "Save Advanced Settings"}
          </Button>
        </CardContent>
      </Card>
    </>
  );
};
