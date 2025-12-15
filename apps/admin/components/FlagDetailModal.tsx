"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { cn } from "../lib/utils";
import { ConfirmDialog } from "./ConfirmDialog";
import { ToastContainer, useToast } from "./Toast";
import {
  X,
  ZoomIn,
  User,
  Users,
  Calendar,
  Mail,
  AlertTriangle,
  Ban,
  Clock,
  CheckCircle,
} from "lucide-react";

interface FlagDetailModalProps {
  flagId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onActionComplete?: () => void;
}

interface FlagData {
  flag: {
    id: string;
    targetType: "user" | "group";
    targetId: string;
    reason: string;
    evidenceUrl: string | null;
    evidencePublicId: string | null;
    status: string;
    createdAt: string;
    reporterId: string | null;
  };
  targetProfile: {
    id: string;
    userId?: string;
    name: string;
    email?: string;
    age?: number;
    gender?: string;
    nationality?: string;
    bio?: string;
    profilePhoto?: string;
    verified?: boolean;
    deleted?: boolean;
    banned?: boolean;
    banReason?: string;
    banExpiresAt?: string;
    accountCreatedAt?: string;
    destination?: string;
    description?: string;
    status?: string;
    flagCount?: number;
    createdAt?: string;
    startDate?: string;
    endDate?: string;
    isPublic?: boolean;
    budget?: number;
    coverImage?: string;
    creatorId?: string;
    membersCount?: number;
    organizer?: {
      id: string;
      name: string;
      email?: string;
      profilePhoto?: string;
      verified?: boolean;
    };
  } | null;
  reporterInfo: {
    id: string;
    name: string;
    email?: string;
    profilePhoto?: string;
  } | null;
  previousFlags?: Array<{
    id: string;
    reason: string;
    status: string;
    createdAt: string;
  }>;
}

export function FlagDetailModal({
  flagId,
  open,
  onOpenChange,
  onActionComplete,
}: FlagDetailModalProps) {
  const [flagData, setFlagData] = React.useState<FlagData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isImageZoomed, setIsImageZoomed] = React.useState(false);
  const [actionDialog, setActionDialog] = React.useState<{
    action: "dismiss" | "warn" | "suspend" | "ban";
    open: boolean;
  } | null>(null);

  // Debug actionDialog state changes
  React.useEffect(() => {
    if (actionDialog) {
      console.log("=== ACTION DIALOG STATE CHANGED ===");
      console.log("Action dialog:", actionDialog);
      console.log("Open:", actionDialog.open);
      console.log("Action:", actionDialog.action);
    } else {
      console.log("Action dialog cleared");
    }
  }, [actionDialog]);
  const [actionReason, setActionReason] = React.useState("");
  const [banUntil, setBanUntil] = React.useState("");
  const [isActionLoading, setIsActionLoading] = React.useState(false);
  const { toasts, toast, removeToast } = useToast();

  const fetchFlagDetails = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/flags/${flagId}`);
      if (!res.ok) throw new Error("Failed to fetch flag details");
      const data = await res.json();
      setFlagData(data);
      
      // Previous flags are now included in the API response
    } catch (error) {
      console.error("Error fetching flag details:", error);
    } finally {
      setIsLoading(false);
    }
  }, [flagId]);

  React.useEffect(() => {
    if (open && flagId) {
      fetchFlagDetails();
    }
  }, [open, flagId, fetchFlagDetails]);


  const handleAction = async (
    action: "dismiss" | "warn" | "suspend" | "ban"
  ) => {
    console.log("=== HANDLE ACTION DEBUG ===");
    console.log("Action:", action);
    console.log("Flag ID:", flagId);
    console.log("Action Reason:", actionReason);
    console.log("Ban Until:", banUntil);

    // Validate suspend action
    if (action === "suspend" && !banUntil) {
      toast({
        title: "Validation Error",
        description: "Suspension end date is required for suspend action",
        variant: "destructive",
      });
      return;
    }

    // Validate banUntil is in the future for suspend
    if (action === "suspend" && banUntil) {
      const suspendDate = new Date(banUntil);
      const now = new Date();
      if (suspendDate <= now) {
        toast({
          title: "Validation Error",
          description: "Suspension end date must be in the future",
          variant: "destructive",
        });
        return;
      }
    }

    setIsActionLoading(true);
    try {
      const payload: {
        action: string;
        reason?: string;
        banUntil?: string;
      } = { action };

      if (actionReason) {
        payload.reason = actionReason;
      }

      if (action === "suspend" && banUntil) {
        // Convert datetime-local to ISO string
        const banUntilDate = new Date(banUntil);
        payload.banUntil = banUntilDate.toISOString();
      }

      console.log("Sending payload:", JSON.stringify(payload, null, 2));

      const res = await fetch(`/api/admin/flags/${flagId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      console.log("Response status:", res.status);
      console.log("Response ok:", res.ok);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
        console.error("API Error:", errorData);
        throw new Error(errorData.error || `Failed to perform action (${res.status})`);
      }

      const result = await res.json();
      console.log("Action result:", result);

      // Refresh flag data
      await fetchFlagDetails();
      setActionDialog(null);
      setActionReason("");
      setBanUntil("");

      // Show success toast with details
      const actionLabels: Record<string, string> = {
        dismiss: "dismissed",
        warn: "warning sent",
        suspend: "user suspended",
        ban: "user banned",
      };

      let description = `Flag has been ${actionLabels[action]}.`;
      
      if (action === "suspend") {
        const suspendUntil = result.suspendUntil || banUntil;
        if (suspendUntil) {
          description += ` User will be suspended until ${new Date(suspendUntil).toLocaleString()}.`;
        }
        if (result.emailSent) {
          description += " Suspension notification email sent to user.";
        } else if (result.emailError) {
          description += ` Suspension completed, but email failed: ${result.emailError}`;
        } else if (result.message) {
          description += ` ${result.message}`;
        }
      } else if (action === "ban") {
        description += " User has been permanently banned.";
        if (result.emailSent) {
          description += " Ban notification email sent to user.";
        } else if (result.emailError) {
          description += ` Ban completed, but email failed: ${result.emailError}`;
        } else if (result.message) {
          description += ` ${result.message}`;
        }
      } else if (action === "warn") {
        if (result.emailSent) {
          description += " Warning email sent to user.";
        } else if (result.emailError) {
          description += ` Warning action completed, but email failed: ${result.emailError}`;
        } else {
          description += ` ${result.message || "Warning action completed, but email was not sent."}`;
        }
      } else if (action === "dismiss") {
        description += " The flag has been removed from the pending queue.";
      }

      toast({
        title: "Action completed",
        description,
        variant: "default",
      });

      // Close modal and refresh list
      if (onActionComplete) {
        onActionComplete();
      }
      
      // Close the detail modal after successful action
      onOpenChange(false);
    } catch (error) {
      console.error("=== ACTION ERROR ===");
      console.error("Error:", error);
      console.error("Error type:", error instanceof Error ? error.constructor.name : typeof error);
      console.error("Error message:", error instanceof Error ? error.message : String(error));
      console.error("Error stack:", error instanceof Error ? error.stack : "No stack");
      
      toast({
        title: "Action failed",
        description: error instanceof Error ? error.message : "Failed to perform action. Please check the console for details.",
        variant: "destructive",
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      pending: {
        label: "Pending",
        className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
      },
      dismissed: {
        label: "Dismissed",
        className: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100",
      },
      actioned: {
        label: "Actioned",
        className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
      },
    };

    const statusConfig = config[status] || {
      label: status,
      className: "bg-muted text-muted-foreground",
    };

    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
          statusConfig.className
        )}
      >
        {statusConfig.label}
      </span>
    );
  };

  if (!open) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent 
          className="max-w-4xl max-h-[90vh] overflow-y-auto w-full sm:w-[95vw] md:w-[90vw] lg:w-[85vw]"
          style={{ 
            pointerEvents: actionDialog?.open ? "none" : "auto",
            opacity: actionDialog?.open ? 0.5 : 1
          }}
        >
          <DialogHeader>
            <DialogTitle>Flag Details</DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">Loading...</div>
            </div>
          ) : !flagData ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">Flag not found</div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Flag Info */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Report Reason</h3>
                  <p className="text-sm">{flagData.flag.reason || "No reason provided"}</p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Status:</span>
                  {getStatusBadge(flagData.flag.status)}
                </div>

                <div className="text-sm text-muted-foreground">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Reported on {formatDate(flagData.flag.createdAt)}
                </div>
              </div>

              {/* Evidence */}
              {flagData.flag.evidenceUrl && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Evidence</h3>
                  <div className="relative">
                    <div
                      className={cn(
                        "relative overflow-hidden rounded-md border cursor-pointer",
                        isImageZoomed
                          ? "fixed inset-4 z-50 bg-background"
                          : "max-w-md"
                      )}
                      onClick={() => setIsImageZoomed(!isImageZoomed)}
                    >
                      <img
                        src={flagData.flag.evidenceUrl!}
                        alt="Evidence"
                        className={cn(
                          "w-full h-auto object-contain",
                          isImageZoomed ? "max-h-[calc(100vh-8rem)]" : ""
                        )}
                      />
                      {!isImageZoomed && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity">
                          <ZoomIn className="h-8 w-8 text-white" />
                        </div>
                      )}
                    </div>
                    {isImageZoomed && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute top-2 right-2 z-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsImageZoomed(false);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Target Profile */}
              {flagData.targetProfile && (
                <div className="space-y-4 border-t pt-4">
                  <h3 className="text-sm font-medium">
                    {flagData.flag.targetType === "user" ? (
                      <User className="inline h-4 w-4 mr-1" />
                    ) : (
                      <Users className="inline h-4 w-4 mr-1" />
                    )}
                    Target {flagData.flag.targetType === "user" ? "User" : "Group"}
                  </h3>

                  {flagData.flag.targetType === "user" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        {flagData.targetProfile.profilePhoto ? (
                          <img
                            src={flagData.targetProfile.profilePhoto}
                            alt={flagData.targetProfile.name}
                            className="h-12 w-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                            <span className="text-sm font-medium">
                              {flagData.targetProfile.name?.charAt(0).toUpperCase() || "?"}
                            </span>
                          </div>
                        )}
                        <div>
                          <div className="font-medium">{flagData.targetProfile.name}</div>
                          {flagData.targetProfile.email && (
                            <div className="text-sm text-muted-foreground">
                              <Mail className="inline h-3 w-3 mr-1" />
                              {flagData.targetProfile.email}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="space-y-1 text-sm">
                        {flagData.targetProfile.age && (
                          <div>Age: {flagData.targetProfile.age}</div>
                        )}
                        {flagData.targetProfile.gender && (
                          <div>Gender: {flagData.targetProfile.gender}</div>
                        )}
                        {flagData.targetProfile.nationality && (
                          <div>Nationality: {flagData.targetProfile.nationality}</div>
                        )}
                      </div>
                      {flagData.targetProfile.banned && (
                        <div className="col-span-2">
                          <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-100">
                            <Ban className="h-3 w-3 mr-1" />
                            {flagData.targetProfile.banExpiresAt ? "Suspended" : "Banned"}
                          </span>
                          {flagData.targetProfile.banReason && (
                            <div className="text-sm text-muted-foreground mt-1">
                              Reason: {flagData.targetProfile.banReason}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="font-medium">{flagData.targetProfile.name}</div>
                      {flagData.targetProfile.destination && (
                        <div className="text-sm">
                          Destination: {flagData.targetProfile.destination}
                        </div>
                      )}
                      {flagData.targetProfile.description && (
                        <div className="text-sm text-muted-foreground">
                          {flagData.targetProfile.description}
                        </div>
                      )}
                      {flagData.targetProfile.organizer && (
                        <div className="text-sm">
                          Organizer: {flagData.targetProfile.organizer.name}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Previous Flags */}
              {flagData.previousFlags && flagData.previousFlags.length > 0 && (
                <div className="space-y-2 border-t pt-4">
                  <h3 className="text-sm font-medium">Previous Flags</h3>
                  <div className="space-y-2">
                    {flagData.previousFlags.map((prevFlag) => (
                      <div
                        key={prevFlag.id}
                        className="flex items-center justify-between p-2 rounded-md border bg-muted/50"
                      >
                        <div className="flex-1">
                          <div className="text-sm">{prevFlag.reason}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatDate(prevFlag.createdAt)}
                          </div>
                        </div>
                        {getStatusBadge(prevFlag.status)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons - Available for all statuses */}
              <div className="flex flex-wrap gap-2 border-t pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      console.log("=== DISMISS BUTTON CLICKED ===");
                      const newDialog = { action: "dismiss" as const, open: true };
                      console.log("Setting action dialog to:", newDialog);
                      setActionDialog(newDialog);
                      console.log("Action dialog state set");
                    }}
                    disabled={isActionLoading}
                    className="flex-1 sm:flex-initial"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Dismiss
                  </Button>
                {flagData.flag.targetType === "user" && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        console.log("Warn button clicked");
                        setActionDialog({ action: "warn", open: true });
                      }}
                      disabled={isActionLoading}
                      className="flex-1 sm:flex-initial"
                    >
                      <AlertTriangle className="mr-2 h-4 w-4" />
                      Warn
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        console.log("Suspend button clicked");
                        setActionDialog({ action: "suspend", open: true });
                      }}
                      disabled={isActionLoading}
                      className="flex-1 sm:flex-initial"
                    >
                      <Clock className="mr-2 h-4 w-4" />
                      Suspend
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        console.log("Ban button clicked");
                        setActionDialog({ action: "ban", open: true });
                      }}
                      disabled={isActionLoading}
                      className="flex-1 sm:flex-initial"
                    >
                      <Ban className="mr-2 h-4 w-4" />
                      Ban
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Action Confirmation Dialogs */}
      {actionDialog && (
        <ConfirmDialog
          open={actionDialog.open}
          onOpenChange={(open) => {
            console.log("=== CONFIRM DIALOG ONOPENCHANGE ===");
            console.log("Open:", open);
            if (!open) {
              console.log("Closing dialog, clearing state");
              setActionDialog(null);
              setActionReason("");
              setBanUntil("");
            }
          }}
          title={
            actionDialog.action === "dismiss"
              ? "Dismiss Flag"
              : actionDialog.action === "warn"
              ? "Warn User"
              : actionDialog.action === "suspend"
              ? "Suspend User"
              : "Ban User"
          }
          description={
            actionDialog.action === "dismiss"
              ? "This will mark the flag as dismissed and remove it from the pending queue. Are you sure?"
              : actionDialog.action === "warn"
              ? "This will send a warning email to the user and mark the flag as actioned. Are you sure?"
              : actionDialog.action === "suspend"
              ? banUntil
                ? `This will temporarily suspend the user until ${new Date(banUntil).toLocaleString()}. Are you sure?`
                : "Please select a suspension end date."
              : "This will permanently ban the user. This action cannot be undone. Are you sure?"
          }
          variant={actionDialog.action === "ban" ? "destructive" : "default"}
          confirmText={
            actionDialog.action === "dismiss"
              ? "Dismiss"
              : actionDialog.action === "warn"
              ? "Warn"
              : actionDialog.action === "suspend"
              ? "Suspend"
              : "Ban"
          }
          onConfirm={async () => {
            console.log("=== CONFIRM DIALOG ONCONFIRM ===");
            console.log("Action:", actionDialog.action);
            try {
              await handleAction(actionDialog.action);
            } catch (error) {
              console.error("Error in onConfirm:", error);
              // Error is already handled in handleAction with toast
              // Don't re-throw to prevent dialog from closing
            }
          }}
          validate={() => {
            console.log("=== VALIDATE FUNCTION CALLED ===");
            console.log("Action:", actionDialog.action);
            console.log("Ban until:", banUntil);
            
            if (actionDialog.action === "suspend" && !banUntil) {
              console.log("Validation failed: suspend requires banUntil");
              return false;
            }
            console.log("Validation passed");
            return true;
          }}
        >
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">
                Admin Note {actionDialog.action === "ban" ? "(recommended)" : "(optional)"}
              </Label>
              <Textarea
                id="reason"
                value={actionReason}
                onChange={(e) => {
                  e.stopPropagation();
                  setActionReason(e.target.value);
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  e.nativeEvent.stopImmediatePropagation();
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  e.nativeEvent.stopImmediatePropagation();
                }}
                onFocus={(e) => {
                  e.stopPropagation();
                  e.nativeEvent.stopImmediatePropagation();
                }}
                onKeyDown={(e) => {
                  e.stopPropagation();
                }}
                onKeyUp={(e) => {
                  e.stopPropagation();
                }}
                placeholder={
                  actionDialog.action === "dismiss"
                    ? "Add a note about why this flag was dismissed..."
                    : actionDialog.action === "warn"
                    ? "Add a note about the warning (this will be included in the email)..."
                    : actionDialog.action === "suspend"
                    ? "Add a note about the suspension reason..."
                    : "Add a note about the ban reason (this is important for permanent bans)..."
                }
                rows={3}
                className="w-full"
                autoFocus={false}
              />
              <p className="text-xs text-muted-foreground mt-1">
                This note will be saved in the admin action log.
              </p>
            </div>
            {actionDialog.action === "suspend" && (
              <div>
                <Label htmlFor="banUntil">Suspension End Date & Time (required)</Label>
                <Input
                  id="banUntil"
                  type="datetime-local"
                  value={banUntil}
                  onChange={(e) => {
                    e.stopPropagation();
                    e.nativeEvent.stopImmediatePropagation();
                    setBanUntil(e.target.value);
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    e.nativeEvent.stopImmediatePropagation();
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.nativeEvent.stopImmediatePropagation();
                  }}
                  onFocus={(e) => {
                    e.stopPropagation();
                    e.nativeEvent.stopImmediatePropagation();
                  }}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                  }}
                  onKeyUp={(e) => {
                    e.stopPropagation();
                  }}
                  required
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full"
                  autoFocus={false}
                />
                {banUntil && (
                  <p className="text-xs text-muted-foreground mt-1">
                    User will be suspended until: <strong>{new Date(banUntil).toLocaleString()}</strong>
                  </p>
                )}
              </div>
            )}
            {actionDialog.action === "ban" && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-sm text-destructive font-medium">
                  ⚠️ Warning: This is a permanent ban. The user will not be able to access their account again.
                </p>
              </div>
            )}
          </div>
        </ConfirmDialog>
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}
