"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { GroupContainer } from "@/components/ui/ios/GroupContainer";

type InviteMode = "batch" | "specific";

interface InviteResult {
  sent: number;
  failed: string[];
  already_invited: string[];
  total_processed: number;
}

export function BetaInvitePanel() {
  const [mode, setMode] = useState<InviteMode>("batch");
  const [batchSize, setBatchSize] = useState<number | "">(10);
  const [specificEmails, setSpecificEmails] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<InviteResult | null>(null);

  async function handleSendInvites() {
    setLoading(true);
    setResult(null);

    try {
      const body =
        mode === "batch"
          ? { batch_size: Number(batchSize) || 1 }
          : {
              emails: specificEmails
                .split("\n")
                .map((e) => e.trim())
                .filter(Boolean),
            };

      const res = await fetch("/api/admin/send-beta-invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Something went wrong");
        return;
      }

      setResult(data);
      if (data.sent > 0) {
        toast.success(`${data.sent} invite${data.sent !== 1 ? "s" : ""} sent successfully`);
      } else {
        toast.info("No invites sent. Maybe no waitlist users matched the criteria.");
      }
    } catch {
      toast.error("Failed to send invites");
    } finally {
      setLoading(false);
    }
  }

  return (
    <GroupContainer className="w-full">
      {/* Row 1: Mode Selector */}
      <div className="flex w-full min-h-[52px] items-center px-4 py-3 gap-3 bg-card">
        <div className="flex flex-col flex-1 min-w-0">
          <span className="text-sm font-medium leading-tight truncate text-foreground">
            Invite Mode
          </span>
          <div className="text-sm text-muted-foreground leading-tight truncate">
            How to select users for beta
          </div>
        </div>
        <div className="flex items-center p-0.5 bg-secondary rounded-lg shrink-0">
          <button
            onClick={() => setMode("batch")}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
              mode === "batch"
                ? "bg-background text-foreground shadow-sm ring-1 ring-border/20"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Batch
          </button>
          <button
            onClick={() => setMode("specific")}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
              mode === "specific"
                ? "bg-background text-foreground shadow-sm ring-1 ring-border/20"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Specific
          </button>
        </div>
      </div>

      {/* Row 2: Configuration */}
      <div className="flex w-full items-start px-4 py-4 gap-4 bg-card">
        {mode === "batch" ? (
          <div className="w-full space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium leading-tight text-foreground">Batch Size</span>
              <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                Targeting status: <span className="text-xs bg-secondary px-1.5 py-0.5 rounded-md text-foreground">new</span>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                min={1}
                max={500}
                value={batchSize}
                onChange={(e) => setBatchSize(e.target.value ? Number(e.target.value) : "")}
                className="w-24 h-10 text-sm font-medium"
              />
              <span className="text-sm text-muted-foreground flex-1">
                Selects oldest waitlist signups first
              </span>
            </div>
          </div>
        ) : (
          <div className="w-full space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium leading-tight text-foreground">Email Addresses</span>
              <span className="text-sm text-muted-foreground">One per line</span>
            </div>
            <Textarea
              rows={4}
              value={specificEmails}
              onChange={(e) => setSpecificEmails(e.target.value)}
              placeholder="alice@example.com&#10;bob@example.com"
              className="w-full text-sm resize-none h-auto bg-background"
            />
          </div>
        )}
      </div>

      {/* Row 3: Action */}
      <div className="flex w-full min-h-[52px] items-center justify-between px-4 py-3 gap-3 bg-card">
        <div className="text-sm text-muted-foreground">
          {mode === "batch"
            ? `Will send up to ${batchSize || 0} invites`
            : `Will send to specific emails`}
        </div>
        <Button
          onClick={handleSendInvites}
          disabled={
            loading ||
            (mode === "specific" && !specificEmails.trim()) ||
            (mode === "batch" && !batchSize)
          }
          className="h-9 px-4 text-sm font-medium shadow-sm gap-2 shrink-0"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          Send Invites
        </Button>
      </div>

      {/* Row 4: Results (Conditional) */}
      {result && (
        <div className="flex w-full flex-col px-4 py-4 gap-3 bg-card border-t border-border/50 animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-sm font-medium text-green-600">
              <CheckCircle2 className="w-4 h-4" />
              <span>{result.sent} sent</span>
            </div>
            {result.failed.length > 0 && (
              <div className="flex items-center gap-2 text-sm font-medium text-red-500">
                <XCircle className="w-4 h-4" />
                <span>{result.failed.length} failed</span>
              </div>
            )}
            {result.already_invited.length > 0 && (
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <AlertCircle className="w-4 h-4" />
                <span>{result.already_invited.length} already active</span>
              </div>
            )}
          </div>

          {result.failed.length > 0 && (
            <div className="mt-1">
              <span className="text-xs font-semibold text-red-500/80 uppercase tracking-wider block mb-1">
                Failed Deliveries
              </span>
              <ul className="text-xs text-muted-foreground space-y-1">
                {result.failed.map((email, i) => (
                  <li key={i}>• {email}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </GroupContainer>
  );
}
