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
import { AlertTriangle, Clock, Sliders, ShieldCheck } from "lucide-react";
import { GroupContainer } from "@/components/ui/ios/GroupContainer";
import { ListRow } from "@/components/ui/ios/ListRow";
import { SectionHeader } from "@/components/ui/ios/SectionHeader";
import { cn } from "@/lib/utils";

interface SettingsData {
  session_ttl_hours: number;
  maintenance_mode: boolean;
  matching_preset: "SAFE" | "BALANCED" | "STRICT";
}

export default function SettingsPage() {
  const [settings, setSettings] = React.useState<SettingsData>({
    session_ttl_hours: 168,
    maintenance_mode: false,
    matching_preset: "BALANCED",
  });
  const [isSaving, setIsSaving] = React.useState(false);
  const [maintenanceDialogOpen, setMaintenanceDialogOpen] = React.useState(false);
  const [pendingMaintenanceMode, setPendingMaintenanceMode] = React.useState(false);
  const [presetDialogOpen, setPresetDialogOpen] = React.useState(false);
  const [pendingPreset, setPendingPreset] = React.useState<"SAFE" | "BALANCED" | "STRICT">("BALANCED");
  const { toasts, toast, removeToast } = useToast();

  React.useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings");
      if (!response.ok) throw new Error("Failed to load settings");
      const data = await response.json();
      setSettings({
        session_ttl_hours: data.session_ttl_hours ?? 168,
        maintenance_mode: data.maintenance_mode ?? false,
        matching_preset: data.matching_preset ?? "BALANCED",
      });
    } catch (error) {
      toast({ title: "Error", description: "Failed to load systems", variant: "destructive" });
    }
  };

  const saveSettings = async (updates: Partial<SettingsData>) => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionTtlHours: updates.session_ttl_hours ?? settings.session_ttl_hours,
          maintenanceMode: updates.maintenance_mode ?? settings.maintenance_mode,
          matchingPreset: updates.matching_preset ?? settings.matching_preset,
        }),
      });

      if (!response.ok) throw new Error("Update failed");
      const data = await response.json();
      setSettings(data.value);
      toast({ title: "Updated", description: "System settings synchronized.", variant: "success" });
    } catch (error) {
      toast({ title: "Error", description: "Could not save changes.", variant: "destructive" });
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
    saveSettings({ session_ttl_hours: hours });
  };

  const handleMatchingPresetChange = (value: "SAFE" | "BALANCED" | "STRICT") => {
    setPendingPreset(value);
    setPresetDialogOpen(true);
  };

  const confirmPresetChange = async () => {
    await saveSettings({ matching_preset: pendingPreset });
    setPresetDialogOpen(false);
  };

  return (
    <div className="max-w-full mx-auto space-y-6">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="space-y-0">
        <h1 className="text-lg font-semibold tracking-tight">Settings</h1>
        <p className="text-md text-muted-foreground">Configure core system behaviors and policies</p>
      </div>

      <div className="space-y-6">
        {/* Maintenance & Safety Section */}
        <section>
          <SectionHeader>Service Control</SectionHeader>
          <GroupContainer>
            <ListRow
              icon={<AlertTriangle className={cn("h-5 w-5", settings.maintenance_mode ? "text-primary" : "text-muted-foreground")} />}
              label="Maintenance Mode"
              secondary="Pauses matching and production APIs while keeping admin access open"
              trailing={
                <Switch
                  checked={settings.maintenance_mode}
                  onCheckedChange={handleMaintenanceToggle}
                  disabled={isSaving}
                  className="cursor-pointer"
                />
              }
              showChevron={false}
            />
            <ListRow
              icon={<Sliders className="h-5 w-5 text-muted-foreground" />}
              label="Matching Strategy"
              secondary={
                settings.matching_preset === "SAFE" ? "Prioritizes distance and overlaps" :
                settings.matching_preset === "STRICT" ? "Higher score threshold required" :
                "Standard balanced algorithm"
              }
              trailing={
                <Select value={settings.matching_preset} onValueChange={handleMatchingPresetChange} disabled={isSaving}>
                  <SelectTrigger className="w-32 !h-8 rounded-lg bg-background border-border text-sm font-medium shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="SAFE">SAFE</SelectItem>
                    <SelectItem value="BALANCED">BALANCED</SelectItem>
                    <SelectItem value="STRICT">STRICT</SelectItem>
                  </SelectContent>
                </Select>
              }
              showChevron={false}
            />
            <ListRow
              icon={<Clock className="h-5 w-5 text-muted-foreground" />}
              label="Session Expiration"
              secondary="Time before user tokens expire (applies to new sessions)"
              trailing={
                <Select value={settings.session_ttl_hours.toString()} onValueChange={handleSessionTtlChange} disabled={isSaving}>
                  <SelectTrigger className="w-32 !h-8 rounded-lg bg-background border-border text-sm font-medium shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="6">6 Hours</SelectItem>
                    <SelectItem value="24">24 Hours</SelectItem>
                    <SelectItem value="168">7 Days</SelectItem>
                    <SelectItem value="720">30 Days</SelectItem>
                  </SelectContent>
                </Select>
              }
              showChevron={false}
            />
          </GroupContainer>
        </section>
      </div>

      <ConfirmDialog
        open={maintenanceDialogOpen}
        onOpenChange={setMaintenanceDialogOpen}
        title={pendingMaintenanceMode ? "Enter Maintenance Mode?" : "Resume Normal Service?"}
        description={pendingMaintenanceMode 
          ? "All client matching requests will return a maintenance error. Continue?" 
          : "Matches will immediately begin generating based on current activity. Continue?"}
        confirmText={pendingMaintenanceMode ? "Enable Mode" : "Resume Service"}
        onConfirm={confirmMaintenanceChange}
      />

      <ConfirmDialog
        open={presetDialogOpen}
        onOpenChange={setPresetDialogOpen}
        title="Switch Matching Preset?"
        description={`This will immediately change the threshold sensitivity for all users. Strategy: ${pendingPreset}`}
        confirmText={`Change to ${pendingPreset}`}
        onConfirm={confirmPresetChange}
      />
    </div>
  );
}
