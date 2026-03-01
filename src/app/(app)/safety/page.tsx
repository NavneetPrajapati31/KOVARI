"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import {
  ShieldCheck,
  AlertTriangle,
  FileText,
  PhoneCall,
  CheckCircle2,
  Clock,
  Search,
  MessageSquareWarning,
  Link as LinkIcon,
  Shield,
  Eye,
  Lock,
  User,
  Users,
  MapPin,
  HeartHandshake,
  ChevronRight
} from "lucide-react";
import { useMyReports, ReportStatus } from "@/shared/hooks/useMyReports";
import { Spinner } from "@heroui/react";
import { useToast } from "@/shared/hooks/use-toast";
import { cn } from "@/shared/utils/utils";

// Helper for formatting dates
function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function SafetyPage() {
  const { user, isLoaded } = useUser();
  const { reports, loading: reportsLoading, error: reportsError } = useMyReports();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleOpenReport = (type: "user" | "group") => {
    toast({
      title: `How to report a ${type}`,
      description: `Navigate to the ${type}'s profile to submit a direct report.`,
    });
  };

  const handleCopyProfileLink = () => {
    if (user) {
      const link = `${window.location.origin}/profile/${user.id}`;
      navigator.clipboard.writeText(link);
      toast({
        title: "Link Copied",
        description: "Your profile link has been copied.",
      });
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background pb-12 md:pb-16 font-sans">
      
      {/* 1. HEADER (True iOS System Settings Hero) */}
      <section className="px-6 pt-16 pb-12 flex flex-col items-center text-center animate-in fade-in duration-700 ease-out">
        <ShieldCheck className="w-10 h-10 text-primary mb-3" strokeWidth={1.5} />
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-3">
          Safety & Trust
        </h1>
        <p className="text-sm text-muted-foreground max-w-xs md:max-w-md mx-auto leading-relaxed">
          Reports are manually reviewed to ensure a respectful and secure environment.
        </p>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-10 relative z-20">
        
        {/* 2. ACTIONS (iOS Grouped List) */}
        <section className="animate-in fade-in slide-in-from-bottom-2 duration-700 delay-100 ease-out fill-mode-both">
          <SectionTitle title="Actions" />
          <div className="bg-card rounded-xl overflow-hidden border border-border/40">
            <div className="divide-y divide-border/40">
              <ListRow 
                icon={AlertTriangle} 
                iconBg=" text-foreground"
                label="Report a User"
                onClick={() => handleOpenReport("user")}
              />
              <ListRow 
                icon={MessageSquareWarning} 
                iconBg=" text-foreground"
                label="Report a Group"
                onClick={() => handleOpenReport("group")}
              />
              <ListRow 
                icon={FileText} 
                iconBg="text-foreground"
                label="View My Reports"
                onClick={() => {
                  document.getElementById("my-reports")?.scrollIntoView({ behavior: "smooth" });
                }}
              />
              <ListRow 
                icon={PhoneCall} 
                iconBg="bg-destructive/10 text-destructive"
                label="Emergency Help"
                isDestructive={true}
                onClick={() => {
                  document.getElementById("emergency")?.scrollIntoView({ behavior: "smooth" });
                }}
              />
            </div>
          </div>
        </section>

        {/* 3. ACCOUNT STATUS (Compact Row Info) */}
        <section className="animate-in fade-in slide-in-from-bottom-2 duration-700 delay-200 ease-out fill-mode-both">
          <SectionTitle title="Your Status" />
          <div className="bg-card rounded-xl overflow-hidden border border-border/40 shadow-sm">
            <div className="divide-y divide-border/40">
              <div className="flex items-center justify-between p-4 bg-card">
                <div className="flex items-center gap-4">
                  <div className="p-1.5 rounded-lg  text-foreground">
                    <ShieldCheck className="w-4 h-4" strokeWidth={1.5} />
                  </div>
                  <span className="text-base text-foreground">Identity Level</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-500/10 rounded-md">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  <span className="text-sm text-green-700 dark:text-green-500 font-medium">Verified</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-card">
                <div className="flex items-center gap-4">
                  <div className="p-1.5 rounded-lg  text-foreground">
                    <Clock className="w-4 h-4" strokeWidth={1.5} />
                  </div>
                  <span className="text-base text-foreground">Member Since</span>
                </div>
                <span className="text-base text-muted-foreground mr-1">
                  {isLoaded && user && user.createdAt ? formatDate(user.createdAt.toString()) : "Recently"}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 4. REPORT FLOW (Informational list) */}
        <section className="animate-in fade-in slide-in-from-bottom-2 duration-700 delay-300 ease-out fill-mode-both">
           <SectionTitle title="How Reporting Works" />
           <div className="bg-card rounded-xl overflow-hidden border border-border/40 shadow-sm">
             <div className="divide-y divide-border/40">
              {[
                { icon: AlertTriangle, title: "1. Submission", desc: "Flag unsafe behavior securely." },
                { icon: Search, title: "2. Investigation", desc: "Moderators review evidence within 24h." },
                { icon: Shield, title: "3. Action Taken", desc: "Violators face warnings or bans." },
                { icon: CheckCircle2, title: "4. Resolution", desc: "You are notified of the outcome." },
              ].map((step, idx) => (
                <div key={idx} className="flex gap-4 items-center p-4 px-6 bg-card">
                  <div className="flex flex-col gap-0.5">
                    <h3 className="text-base text-foreground font-medium">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.desc}</p>
                  </div>
                </div>
              ))}
             </div>
           </div>
        </section>

        {/* 5. SUPPORT: My Reports List */}
        <section id="my-reports" className="scroll-mt-32 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-400 ease-out fill-mode-both">
          <SectionTitle title="My Reports" rightLabel={`${reports.length} Total`} />

          <div className="bg-card rounded-xl min-h-56 flex flex-col overflow-hidden border border-border/40 shadow-sm">
            {reportsLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
                <Spinner size="md" color="default" />
              </div>
            ) : reportsError ? (
              <div className="flex-1 p-8 flex flex-col items-center justify-center text-center">
                <AlertTriangle className="w-8 h-8 mb-2 text-muted-foreground" strokeWidth={1.5} />
                <p className="text-base text-foreground mb-1">Couldn't load reports</p>
                <p className="text-sm text-muted-foreground">{reportsError}</p>
              </div>
            ) : reports.length === 0 ? (
              <div className="flex-1 p-8 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12  rounded-full flex items-center justify-center mb-4">
                  <HeartHandshake className="w-6 h-6 text-muted-foreground" strokeWidth={1.5} />
                </div>
                <h3 className="text-base text-foreground mb-1">No active reports</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
                  We're glad things are safe. You can report concerns here anytime.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/40 flex-1 overflow-y-auto max-h-96">
                {reports.map((report) => (
                  <div key={report.id} className="p-4 sm:p-5 flex flex-col gap-2 hover:/50 transition-colors duration-150">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-base text-foreground truncate max-w-40 sm:max-w-56">
                          {report.targetName}
                        </span>
                        <span className="text-xs text-muted-foreground uppercase px-1.5  rounded font-medium tracking-wide">
                          {report.targetType}
                        </span>
                      </div>
                      <ReportStatusBadge status={report.status} />
                    </div>
                    <p className="text-sm text-foreground/90 line-clamp-1">
                      "{report.reason}"
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDate(report.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* 6. INFORM: Safety Tips (iOS Notes style) */}
        <section className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-500 ease-out fill-mode-both">
          <div>
            <SectionTitle title="Solo Travel Guidelines" />
            <div className="bg-card rounded-xl p-4 border border-border/40">
              <ul className="space-y-4">
                <TipRow text="Share full itinerary with a trusted friend" />
                <TipRow text="Research local emergency numbers" />
                <TipRow text="Leave quietly if you feel uncomfortable" />
              </ul>
            </div>
          </div>

          <div>
            <SectionTitle title="Group Travel Guidelines" />
            <div className="bg-card rounded-xl p-4 sm:p-5 border border-border/40">
              <ul className="space-y-4">
                <TipRow text="Meet in a public space before departing" />
                <TipRow text="Discuss budgets and styles clearly upfront" />
                <TipRow text="Avoid sharing sensitive financial info" />
              </ul>
            </div>
          </div>

          <div>
            <SectionTitle title="Real-Life Meetings" />
            <div className="bg-card rounded-xl p-4 sm:p-5 border border-border/40">
              <ul className="space-y-4">
                <TipRow text="First meeting must be in a well-lit cafe" />
                <TipRow text="Arrange your own independent transport" />
                <TipRow text="Text a friend when arriving and leaving" />
              </ul>
            </div>
          </div>
        </section>

        {/* 7. PROTECT: Emergency Help (iOS Settings Contact Style) */}
        <section id="emergency" className="scroll-mt-32 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-500 ease-out fill-mode-both">
          <SectionTitle title="Emergency Contact" />
          <div className="bg-card rounded-xl overflow-hidden border border-border/40">
            <div className="p-4 px-6 border-b border-border/40">
              <p className="text-sm text-muted-foreground leading-relaxed">
                If in immediate danger, contact local authorities immediately.
              </p>
            </div>
            
            <div className="divide-y divide-border/40">
              <a href="tel:112" className="flex items-center justify-between p-4 px-6 hover:/50 transition-colors duration-150 hover:bg-secondary">
                <div className="flex flex-col gap-0.5">
                  <h4 className="text-base text-foreground">National Emergency</h4>
                  <p className="text-base text-destructive">112</p>
                </div>
                <PhoneCall className="w-4 h-4 text-destructive" strokeWidth={1.5} />
              </a>

              <a href="tel:1091" className="flex items-center justify-between p-4 px-6 hover:/50 transition-colors duration-150 hover:bg-secondary">
                <div className="flex flex-col gap-0.5">
                  <h4 className="text-base text-foreground">Women Helpline</h4>
                  <p className="text-base text-destructive">1091</p>
                </div>
                <PhoneCall className="w-4 h-4 text-destructive" strokeWidth={1.5} />
              </a>
              
              <button 
                className="w-full flex items-center justify-between p-4 px-6 hover:/50 transition-colors duration-150 hover:bg-secondary text-left"
                onClick={handleCopyProfileLink}
              >
                <div className="flex flex-col gap-0.5">
                  <h4 className="text-base text-primary">Copy Profile Link</h4>
                  <p className="text-sm text-muted-foreground">For providing to authorities</p>
                </div>
                <LinkIcon className="w-4 h-4 text-primary" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </section>

        {/* 8. Trust Footer */}
        <section className="pt-8 pb-4 flex items-center justify-center animate-in fade-in duration-1000 delay-500">
          <div className="flex items-center gap-x-3 text-xs text-muted-foreground uppercase tracking-widest">
             <div className="flex items-center gap-1.5">
               <Eye className="w-3.5 h-3.5 opacity-60" strokeWidth={1.5} /> Reviewed
             </div>
             <div className="w-1 h-1 rounded-full bg-border/60" />
             <div className="flex items-center gap-1.5">
               <Lock className="w-3.5 h-3.5 opacity-60" strokeWidth={1.5} /> Encrypted
             </div>
          </div>
        </section>
      </div>

    </div>
  );
}

// ----------------------------------------
// Local Reusable Components
// ----------------------------------------

function SectionTitle({ title, rightLabel }: { title: string, rightLabel?: string }) {
  return (
    <div className="flex items-center justify-between px-4 pb-2">
      <h2 className="text-sm text-muted-foreground uppercase tracking-wider">{title}</h2>
      {rightLabel && (
        <span className="text-sm text-muted-foreground">{rightLabel}</span>
      )}
    </div>
  );
}

function ListRow({ icon: Icon, iconBg, label, value, isDestructive, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 hover:/50 hover:bg-secondary duration-150 transition-colors"
    >
      <div className="flex items-center gap-4">
        <div className={cn("p-1.5 rounded-lg", iconBg)}>
          <Icon className="w-4 h-4" strokeWidth={1.5} />
        </div>
        <span className={cn("text-base", isDestructive ? "text-destructive" : "text-foreground")}>{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {value && <span className="text-base text-muted-foreground mr-1">{value}</span>}
        <ChevronRight className="w-4 h-4 text-muted-foreground/40" strokeWidth={2} />
      </div>
    </button>
  );
}

function ReportStatusBadge({ status }: { status: ReportStatus }) {
  const map: Record<ReportStatus, { label: string; text: string; dot: string }> = {
    pending: { label: "Pending", text: "text-amber-600 dark:text-amber-500", dot: "bg-amber-500" },
    reviewed: { label: "Ongoing", text: "text-primary", dot: "bg-primary" },
    resolved: { label: "Resolved", text: "text-green-600 dark:text-green-500", dot: "bg-green-500" },
    dismissed: { label: "Dismissed", text: "text-muted-foreground", dot: "-foreground" },
  };

  const config = map[status] || map.pending;

  return (
    <div className={`flex items-center gap-1.5 text-sm ${config.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </div>
  );
}

function TipRow({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-5">
      <div className="mt-2 ml-2 w-1.5 h-1.5 bg-muted rounded-full flex-shrink-0" />
      <span className="text-base text-foreground leading-snug">{text}</span>
    </li>
  );
}