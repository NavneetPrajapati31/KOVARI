'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { cn } from '../lib/utils';
import { ToastContainer, useToast } from './Toast';
import { StatusBadge } from './ui/ios/StatusBadge';
import { getThumbnailUrl, getFullImageUrl } from '../lib/cloudinary-client';
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
  ExternalLink,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';

interface FlagDetailModalProps {
  flagId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onActionComplete?: () => void;
}

interface FlagData {
  flag: {
    id: string;
    targetType: 'user' | 'group';
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
  const [evidenceUrl, setEvidenceUrl] = React.useState<string | null>(null);
  const [viewMode, setViewMode] = React.useState<'view' | 'confirm'>('view');
  const [actionDialog, setActionDialog] = React.useState<{
    action: 'dismiss' | 'warn' | 'suspend' | 'ban' | 'resolve';
  } | null>(null);

  // Reset view state when modal opens/closes
  React.useEffect(() => {
    if (!open) {
      setViewMode('view');
      setActionDialog(null);
      setActionReason('');
      setBanUntil('');
    }
  }, [open]);
  const [actionReason, setActionReason] = React.useState('');
  const [banUntil, setBanUntil] = React.useState('');
  const [isActionLoading, setIsActionLoading] = React.useState(false);
  const { toasts, toast, removeToast } = useToast();

  const fetchFlagDetails = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/flags/${flagId}`);
      if (!res.ok) throw new Error('Failed to fetch flag details');
      const data = await res.json();
      setFlagData(data);

      // Fetch evidence URL from evidence endpoint to get fresh signed URL
      if (data.flag?.evidenceUrl) {
        try {
          const evidenceRes = await fetch(
            `/api/admin/flags/${flagId}/evidence`,
          );
          if (evidenceRes.ok) {
            const evidenceData = await evidenceRes.json();
            setEvidenceUrl(
              evidenceData.signedUrl ||
                evidenceData.evidenceUrl ||
                data.flag.evidenceUrl,
            );
          } else {
            // Fallback to original URL if evidence endpoint fails
            setEvidenceUrl(data.flag.evidenceUrl);
          }
        } catch (error) {
          console.error('Error fetching evidence URL:', error);
          // Fallback to original URL
          setEvidenceUrl(data.flag.evidenceUrl);
        }
      } else {
        setEvidenceUrl(null);
      }

      // Previous flags are now included in the API response
    } catch (error) {
      console.error('Error fetching flag details:', error);
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
    action: 'dismiss' | 'warn' | 'suspend' | 'ban' | 'resolve',
  ) => {
    console.log('=== HANDLE ACTION DEBUG ===');
    console.log('Action:', action);
    console.log('Flag ID:', flagId);
    console.log('Action Reason:', actionReason);
    console.log('Ban Until:', banUntil);

    // Validate suspend action
    if (action === 'suspend' && !banUntil) {
      toast({
        title: 'Validation Error',
        description: 'Suspension end date is required for suspend action',
        variant: 'destructive',
      });
      return;
    }

    // Validate banUntil is in the future for suspend
    if (action === 'suspend' && banUntil) {
      const suspendDate = new Date(banUntil);
      const now = new Date();
      if (suspendDate <= now) {
        toast({
          title: 'Validation Error',
          description: 'Suspension end date must be in the future',
          variant: 'destructive',
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

      if (action === 'suspend' && banUntil) {
        // Convert datetime-local to ISO string
        const banUntilDate = new Date(banUntil);
        payload.banUntil = banUntilDate.toISOString();
      }

      console.log('Sending payload:', JSON.stringify(payload, null, 2));

      const res = await fetch(`/api/admin/flags/${flagId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      console.log('Response status:', res.status);
      console.log('Response ok:', res.ok);

      if (!res.ok) {
        const errorData = await res
          .json()
          .catch(() => ({ error: 'Unknown error' }));
        console.error('API Error:', errorData);
        throw new Error(
          errorData.error || `Failed to perform action (${res.status})`,
        );
      }

      const result = await res.json();
      console.log('Action result:', result);

      // Refresh flag data
      await fetchFlagDetails();
      setActionDialog(null);
      setActionReason('');
      setBanUntil('');

      // Show success toast with details
      const actionLabels: Record<string, string> = {
        dismiss: 'dismissed',
        warn: 'warning sent',
        suspend: 'user suspended',
        ban: 'user banned',
      };

      let description = `Flag has been ${actionLabels[action]}.`;

      if (action === 'suspend') {
        const suspendUntil = result.suspendUntil || banUntil;
        if (suspendUntil) {
          description += ` User will be suspended until ${new Date(suspendUntil).toLocaleString()}.`;
        }
        if (result.emailSent) {
          description += ' Suspension notification email sent to user.';
        } else if (result.emailError) {
          description += ` Suspension completed, but email failed: ${result.emailError}`;
        } else if (result.message) {
          description += ` ${result.message}`;
        }
      } else if (action === 'ban') {
        description += ' User has been permanently banned.';
        if (result.emailSent) {
          description += ' Ban notification email sent to user.';
        } else if (result.emailError) {
          description += ` Ban completed, but email failed: ${result.emailError}`;
        } else if (result.message) {
          description += ` ${result.message}`;
        }
      } else if (action === 'warn') {
        if (result.emailSent) {
          description += ' Warning email sent to user.';
        } else if (result.emailError) {
          description += ` Warning action completed, but email failed: ${result.emailError}`;
        } else {
          description += ` ${result.message || 'Warning action completed, but email was not sent.'}`;
        }
      } else if (action === 'dismiss') {
        description += ' The flag has been removed from the pending queue.';
      }

      toast({
        title: 'Action completed',
        description,
        variant: 'default',
      });

      // Close modal and refresh list
      if (onActionComplete) {
        onActionComplete();
      }

      // Close the detail modal after successful action
      onOpenChange(false);
    } catch (error) {
      console.error('=== ACTION ERROR ===');
      console.error('Error:', error);
      console.error(
        'Error type:',
        error instanceof Error ? error.constructor.name : typeof error,
      );
      console.error(
        'Error message:',
        error instanceof Error ? error.message : String(error),
      );
      console.error(
        'Error stack:',
        error instanceof Error ? error.stack : 'No stack',
      );

      toast({
        title: 'Action failed',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to perform action. Please check the console for details.',
        variant: 'destructive',
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };


  if (!open) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="max-w-4xl bg-card max-h-[90vh] p-0 w-[calc(100%-2rem)] sm:w-[95vw] md:w-[90vw] lg:w-[85vw] overflow-hidden gap-0 flex flex-col rounded-2xl"
          // Important: Stop propagation of clicks inside the content so they don't accidentally close unexpected things
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <DialogHeader className="px-4 sm:px-6 py-4 border-b">
            <DialogTitle className="text-md text-start">
              {viewMode === 'confirm' ? (
                actionDialog?.action === 'dismiss' ? 'Dismiss Flag' :
                actionDialog?.action === 'resolve' ? 'Resolve Flag' :
                actionDialog?.action === 'warn' ? 'Warn User' :
                actionDialog?.action === 'suspend' ? 'Suspend User' :
                'Ban User'
              ) : (
                'Flag Details'
              )}
            </DialogTitle>
          </DialogHeader>

          <div className={`overflow-y-auto flex-1 px-4 sm:px-6 pt-4 pb-2 sm:pb-4 hide-scrollbar ${viewMode === 'confirm' ? 'pb-4' : 'pb-2'}`}>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : !flagData ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-muted-foreground">Flag not found</div>
              </div>
            ) : viewMode === 'confirm' ? (
              <div className="space-y-4 max-w-2xl">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground leading-relaxed">
                    {actionDialog?.action === 'dismiss'
                      ? 'This will mark the flag as dismissed and remove it from the pending queue. Are you sure?'
                      : actionDialog?.action === 'resolve'
                        ? 'This will mark the flag as resolved/actioned without taking punitive measures. Are you sure?'
                        : actionDialog?.action === 'warn'
                          ? 'This will send a warning email to the user and mark the flag as actioned. Are you sure?'
                          : actionDialog?.action === 'suspend'
                            ? 'Temporarily suspend this user. They will be unable to access the platform until the suspension expires.'
                            : 'Permanently ban this user. This action cannot be undone easily.'}
                  </p>
                </div>

                <div className="space-y-4 pt-1">
                  <div className="space-y-2">
                    <Label htmlFor="reason" className="text-sm font-semibold text-foreground">
                      {actionDialog?.action === 'suspend' || actionDialog?.action === 'ban' ? 'Reason for Action' : 'Admin Note (Optional)'}
                    </Label>
                    <Textarea
                      id="reason"
                      value={actionReason}
                      onChange={(e) => setActionReason(e.target.value)}
                      placeholder={
                        actionDialog?.action === 'dismiss'
                          ? 'Add a note about why this flag was dismissed...'
                          : 'Provide specific context for this action...'
                      }
                      className="min-h-[100px] rounded-lg bg-background border-border shadow-none focus-visible:ring-0 text-sm"
                    />
                  </div>

                  {actionDialog?.action === 'suspend' && (
                    <div className="space-y-2">
                      <Label htmlFor="banUntil" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                        Suspension Expires
                      </Label>
                      <Input
                        id="banUntil"
                        type="datetime-local"
                        value={banUntil}
                        onChange={(e) => setBanUntil(e.target.value)}
                        className="h-10 rounded-lg bg-muted/20 border-border/5 shadow-none focus-visible:ring-0"
                      />
                    </div>
                  )}

                  {actionDialog?.action === 'ban' && (
                    <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/10 mb-4">
                      <div className="flex items-center gap-2 text-red-500 mb-2">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm font-semibold uppercase tracking-wider">Critical Action</span>
                      </div>
                      <p className="text-sm text-red-500/80 font-medium">Banning a user is permanent and cannot be easily reversed.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Flag Info */}
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <h3 className="text-sm font-medium text-foreground whitespace-nowrap">Reason:</h3>
                    <p className="text-sm leading-relaxed text-foreground font-medium">
                      {flagData.flag.reason || 'No reason provided'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">Status:</span>
                    <StatusBadge status={flagData.flag.status} showDot={false} className="text-sm font-medium" />
                  </div>

                  {(evidenceUrl || flagData.flag.evidenceUrl) && (
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-foreground">Evidence:</h3>
                      <a
                        href={getFullImageUrl(evidenceUrl || flagData.flag.evidenceUrl!)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                      >
                        View Attachment
                      </a>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <span>Reported on:</span>
                    <span className="text-sm font-medium text-foreground"> {formatDate(flagData.flag.createdAt)}</span>
                  </div>
                </div>

                {/* Target Profile */}
                {flagData.targetProfile && (
                  <div className="space-y-4">
                    {flagData.flag.targetType === 'user' ? (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-background hover:bg-secondary border border-border px-4 py-3 rounded-lg overflow-hidden">
                        <div className="flex items-center gap-3 min-w-0">
                          {flagData.targetProfile.profilePhoto ? (
                            <img
                              src={getThumbnailUrl(flagData.targetProfile.profilePhoto)}
                              alt={flagData.targetProfile.name}
                              className="h-12 w-12 rounded-full object-cover shrink-0"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center shrink-0">
                              <span className="text-gray-500 text-sm font-medium">
                                {flagData.targetProfile.name
                                  ?.charAt(0)
                                  .toUpperCase() || '?'}
                              </span>
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-medium text-sm truncate">
                              {flagData.targetProfile.name}
                            </div>
                            {flagData.targetProfile.email && (
                              <div className="text-sm text-muted-foreground truncate">
                                {flagData.targetProfile.email}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="shrink-0 flex justify-center sm:justify-start sm:ml-auto border-t border-border sm:border-t-0 pt-2 sm:pt-0">
                          <Link 
                            href={`/users/${flagData.targetProfile?.id || flagData.flag.targetId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary"
                          >
                            View Profile
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-background hover:bg-secondary border border-border px-4 py-2 rounded-lg overflow-hidden">
                        <div className="flex items-center gap-3 min-w-0">
                          {flagData.targetProfile.coverImage ? (
                            <img
                              src={getThumbnailUrl(flagData.targetProfile.coverImage)}
                              alt={flagData.targetProfile.name}
                              className="h-12 w-12 rounded-full object-cover shrink-0"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center shrink-0">
                              <Users className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-medium text-sm truncate">
                              {flagData.targetProfile.name}
                            </div>
                            {flagData.targetProfile.organizer && (
                              <div className="text-sm text-muted-foreground truncate">
                                Organizer: {flagData.targetProfile.organizer.name}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="shrink-0 flex justify-center sm:justify-start sm:ml-auto border-t border-border sm:border-t-0 pt-2 sm:pt-0">
                          <Link 
                            href={`/groups/${flagData.flag.targetId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                          >
                            View Group
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Previous Flags */}
                {flagData.previousFlags && flagData.previousFlags.length > 0 && (
                  <div className="space-y-2 pt-4">
                    <h3 className="text-sm font-medium">Previous Flags</h3>
                    <div className="space-y-2">
                      {flagData.previousFlags.map((prevFlag) => (
                        <div
                          key={prevFlag.id}
                          className="flex items-center justify-between p-2 rounded-md border bg-secondary"
                        >
                          <div className="flex-1">
                            <div className="text-sm">{prevFlag.reason}</div>
                            <div className="text-xs text-muted-foreground">
                              {formatDate(prevFlag.createdAt)}
                            </div>
                          </div>
                          <StatusBadge status={prevFlag.status} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {!isLoading && flagData && (
            <div className={cn(
               "pt-0 pb-4 px-4 sm:px-6 bg-card w-full sticky bottom-0 z-10",
               viewMode === 'confirm' ? "flex flex-row gap-2" : "grid sm:grid-cols-3 grid-cols-1 gap-2"
            )}>
              {viewMode === 'confirm' ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setViewMode('view');
                      setActionDialog(null);
                      setActionReason('');
                      setBanUntil('');
                    }}
                    disabled={isActionLoading}
                    className="flex-1 h-10 rounded-lg font-medium shadow-none transition-none"
                  >
                    Back
                  </Button>
                  <Button
                    variant={actionDialog?.action === 'ban' ? 'destructive' : 'default'}
                    onClick={() => actionDialog && handleAction(actionDialog.action)}
                    disabled={isActionLoading || (actionDialog?.action === 'suspend' && !banUntil) || (actionDialog?.action === 'suspend' && !actionReason.trim()) || (actionDialog?.action === 'ban' && !actionReason.trim())}
                    className={cn(
                      "flex-1 h-10 rounded-lg font-medium shadow-none transition-none",
                      actionDialog?.action === 'ban' ? 'bg-red-500 hover:bg-red-600' : 'bg-primary hover:bg-primary/90'
                    )}
                  >
                    {isActionLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Processing...</span>
                      </div>
                    ) : (
                      <span>Confirm</span>
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setActionDialog({ action: 'dismiss' });
                      setViewMode('confirm');
                    }}
                    disabled={isActionLoading}
                    className="flex-1 h-10 rounded-lg border-border font-medium shadow-none transition-none"
                  >
                    Dismiss
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setActionDialog({ action: 'resolve' });
                      setViewMode('confirm');
                    }}
                    disabled={isActionLoading}
                    className="flex-1 h-10 rounded-lg border-border font-medium shadow-none transition-none"
                  >
                    Resolve
                  </Button>
                  {flagData.flag.targetType === 'user' ? (
                    <Link
                      href={`/users/${flagData.targetProfile?.id || flagData.flag.targetId}?flagId=${flagData.flag.id}`}
                      target="_blank"
                      className="w-full"
                    >
                      <Button
                        disabled={isActionLoading}
                        className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-medium shadow-none"
                      >
                        Action
                      </Button>
                    </Link>
                  ) : (
                    <Link
                      href={`/groups/${flagData.flag.targetId}?flagId=${flagData.flag.id}`}
                      target="_blank"
                      className="w-full"
                    >
                      <Button
                        disabled={isActionLoading}
                        className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-medium shadow-none transition-none"
                      >
                        Action
                      </Button>
                    </Link>
                  )}
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}
