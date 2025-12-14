"use client";

import * as React from "react";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ToastContainer, useToast } from "@/components/Toast";
import { AlertTriangle, Clock, Sliders } from "lucide-react";

interface SettingsData {
  session_ttl_hours: number;
  maintenance_mode: boolean;
  matching_preset: "SAFE" | "BALANCED" | "STRICT";
}

export default function SettingsPage() {
  const [settings, setSettings] = React.useState<SettingsData>({
    session_ttl_hours: 24,
    maintenance_mode: false,
    matching_preset: "BALANCED",
  });
  const [isSaving, setIsSaving] = React.useState(false);
  const [maintenanceDialogOpen, setMaintenanceDialogOpen] =
    React.useState(false);
  const [pendingMaintenanceMode, setPendingMaintenanceMode] =
    React.useState(false);
  const [sessionTtlChanged, setSessionTtlChanged] = React.useState(false);
  const { toasts, toast, removeToast } = useToast();

  React.useEffect(() => {
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings");
      if (!response.ok) throw new Error("Failed to load settings");
      const data = await response.json();
      setSettings({
        session_ttl_hours: data.session_ttl_hours ?? 24,
        maintenance_mode: data.maintenance_mode ?? false,
        matching_preset: data.matching_preset ?? "BALANCED",
      });
    } catch (error) {
      console.error("Error loading settings:", error);
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive",
      });
    }
  };

  const saveSettings = async (updates: Partial<SettingsData>) => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionTtlHours:
            updates.session_ttl_hours ?? settings.session_ttl_hours,
          maintenanceMode:
            updates.maintenance_mode ?? settings.maintenance_mode,
          matchingPreset: updates.matching_preset ?? settings.matching_preset,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save settings");
      }

      const data = await response.json();
      setSettings(data.value);
      setSessionTtlChanged(false);
      toast({
        title: "Success",
        description: "Settings saved successfully",
        variant: "success",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleMaintenanceToggle = (checked: boolean) => {
    setPendingMaintenanceMode(checked);
    setMaintenanceDialogOpen(true);
  };

  const confirmMaintenanceChange = async () => {
    await saveSettings({ maintenance_mode: pendingMaintenanceMode });
    setMaintenanceDialogOpen(false);
  };

  const handleSessionTtlChange = (value: string) => {
    const hours = Number(value);
    setSettings((prev) => ({ ...prev, session_ttl_hours: hours }));
    setSessionTtlChanged(true);
    saveSettings({ session_ttl_hours: hours });
  };

  const handleMatchingPresetChange = (
    value: "SAFE" | "BALANCED" | "STRICT"
  ) => {
    saveSettings({ matching_preset: value });
  };

  const presetDescriptions = {
    SAFE: "Stricter distance + date overlap requirements",
    BALANCED: "Current default matching behavior",
    STRICT: "Higher score threshold for matches",
  };

  return (
    <main className="p-8 space-y-6">
      <div className="space-y-6 max-w-full">
        {/* System Settings Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">System Settings</h2>

          {/* Maintenance Mode */}
          <div className="rounded-lg border p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  <Label
                    htmlFor="maintenance-mode"
                    className="text-base font-medium"
                  >
                    Maintenance Mode
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Maintenance mode pauses all matching APIs but keeps user login
                  active.
                </p>
                {settings.maintenance_mode && (
                  <p className="text-sm text-destructive font-medium mt-2">
                    Maintenance mode is currently active. All matching
                    operations are paused.
                  </p>
                )}
              </div>
              <Switch
                id="maintenance-mode"
                checked={settings.maintenance_mode}
                onCheckedChange={handleMaintenanceToggle}
                disabled={isSaving}
              />
            </div>
          </div>

          {/* Session TTL */}
          <div className="rounded-lg border p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Label
                    htmlFor="session-ttl"
                    className="text-base font-medium"
                  >
                    Session TTL
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Duration before user sessions expire and require
                  re-authentication.
                </p>
                {sessionTtlChanged && (
                  <p className="text-sm text-amber-600 dark:text-amber-400 font-medium mt-2">
                    New TTL applies only to future sessions.
                  </p>
                )}
              </div>
              <div className="w-48">
                <Select
                  value={settings.session_ttl_hours.toString()}
                  onValueChange={handleSessionTtlChange}
                  disabled={isSaving}
                >
                  <SelectTrigger id="session-ttl" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">6 hours</SelectItem>
                    <SelectItem value="12">12 hours</SelectItem>
                    <SelectItem value="24">24 hours (default)</SelectItem>
                    <SelectItem value="168">7 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Matching Preset */}
          <div className="rounded-lg border p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-muted-foreground" />
                  <Label
                    htmlFor="matching-preset"
                    className="text-base font-medium"
                  >
                    Matching Preset
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  {presetDescriptions[settings.matching_preset]}
                </p>
                <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                  <p>
                    <strong>SAFE:</strong> {presetDescriptions.SAFE}
                  </p>
                  <p>
                    <strong>BALANCED:</strong> {presetDescriptions.BALANCED}
                  </p>
                  <p>
                    <strong>STRICT:</strong> {presetDescriptions.STRICT}
                  </p>
                </div>
              </div>
              <div className="w-48">
                <Select
                  value={settings.matching_preset}
                  onValueChange={handleMatchingPresetChange}
                  disabled={isSaving}
                >
                  <SelectTrigger id="matching-preset" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SAFE">SAFE</SelectItem>
                    <SelectItem value="BALANCED">BALANCED</SelectItem>
                    <SelectItem value="STRICT">STRICT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Maintenance Mode Confirmation Dialog */}
      <ConfirmDialog
        open={maintenanceDialogOpen}
        onOpenChange={setMaintenanceDialogOpen}
        title={
          pendingMaintenanceMode
            ? "Enable Maintenance Mode?"
            : "Disable Maintenance Mode?"
        }
        description={
          pendingMaintenanceMode
            ? "This will pause all matching APIs. Users will still be able to log in, but no new matches will be generated. Are you sure you want to continue?"
            : "This will resume all matching APIs. The system will return to normal operation. Are you sure you want to continue?"
        }
        variant={pendingMaintenanceMode ? "destructive" : "default"}
        confirmText={
          pendingMaintenanceMode
            ? "Enable Maintenance Mode"
            : "Disable Maintenance Mode"
        }
        onConfirm={confirmMaintenanceChange}
      />

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </main>
  );
}
