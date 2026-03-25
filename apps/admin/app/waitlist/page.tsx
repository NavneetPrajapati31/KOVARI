"use client";

import { useEffect, useState } from "react";
import { 
  Users, 
  Mail, 
  TrendingUp,
  RefreshCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { GroupContainer } from "@/components/ui/ios/GroupContainer";
import { ListRow } from "@/components/ui/ios/ListRow";
import { SectionHeader } from "@/components/ui/ios/SectionHeader";
import { GrowthChart } from "@/components/admin/GrowthChart";
import { SourceBreakdown } from "@/components/admin/SourceBreakdown";
import { Funnel } from "@/components/admin/Funnel";
import { EmailHealth } from "@/components/admin/EmailHealth";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface AnalyticsData {
  totalSignups: number;
  emailsSent: number;
  pendingEmails: number;
  conversionRate: number;
  landingViews: number;
  waitlistClicks: number;
  signupTrend: number;
  sourceBreakdown: { source: string; count: number; percentage: string | number }[];
  dailySignups: { date: string; count: number }[];
  avgEmailDelayMinutes: number;
}

export default function WaitlistDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchAnalytics = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch("/api/admin/waitlist-analytics");
      if (!response.ok) throw new Error("Failed to fetch analytics");
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load waitlist analytics");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (isLoading) {
    return (
      <div className="max-w-full mx-auto space-y-8">
        <div className="flex justify-between items-end">
          <div className="space-y-2">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-5 w-48" />
          </div>
          <Skeleton className="h-10 w-32 rounded-full" />
        </div>
        <div className="space-y-8">
          <section>
            <Skeleton className="h-4 w-32 mb-4 ml-4" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </section>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Skeleton className="h-80 w-full rounded-2xl" />
            <Skeleton className="h-80 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="max-w-full mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
        <div className="space-y-0">
          <h1 className="text-lg font-semibold tracking-tight">Waitlist Analytics</h1>
          <p className="text-md text-muted-foreground">Monitor growth and email pipeline health</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchAnalytics}
          disabled={isRefreshing}
          className="rounded-full h-10 px-5 gap-2 transition-all hover:bg-muted/50"
        >
          <RefreshCcw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          {isRefreshing ? "Refreshing" : "Refresh"}
        </Button>
      </div>

      <div className="space-y-8">
        {/* KPI Section */}
        <section>
          <SectionHeader>Performance Metrics</SectionHeader>
          <GroupContainer>
            <ListRow
              icon={<Users className="h-5 w-5 text-blue-500" />}
              label="Total Signups"
              secondary={`${data.signupTrend >= 0 ? "+" : "-"}${Math.abs(data.signupTrend)}% vs last 30 days`}
              trailing={<span className="font-bold text-lg">{data.totalSignups.toLocaleString()}</span>}
              showChevron={false}
            />
            <ListRow
              icon={<TrendingUp className="h-5 w-5 text-green-500" />}
              label="Conversion Rate"
              secondary="Landing views to signup ratio"
              trailing={<span className="font-bold text-lg">{data.conversionRate}%</span>}
              showChevron={false}
            />
            <ListRow
              icon={<Mail className="h-5 w-5 text-orange-500" />}
              label="Email Success"
              secondary="Confirmation delivery rate"
              trailing={<span className="font-bold text-lg">{Math.round((data.emailsSent / (data.totalSignups || 1)) * 100)}%</span>}
              showChevron={false}
            />
            <ListRow
              icon={<RefreshCcw className="h-5 w-5 text-purple-500" />}
              label="Avg. Pipeline Delay"
              secondary="Creation to delivery time"
              trailing={<span className="font-bold text-lg">{data.avgEmailDelayMinutes}m</span>}
              showChevron={false}
            />
          </GroupContainer>
        </section>

        {/* Growth & Funnel Row */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          <div className="lg:col-span-3">
            <SectionHeader>Growth Trend</SectionHeader>
            <div className="rounded-2xl border bg-card/10 overflow-hidden p-6">
              <GrowthChart data={data.dailySignups} />
            </div>
          </div>
          <div className="lg:col-span-2">
            <SectionHeader>Conversion Funnel</SectionHeader>
            <div className="rounded-2xl border bg-card/10 overflow-hidden p-6">
              <Funnel data={{
                views: data.landingViews,
                clicks: data.waitlistClicks,
                submissions: data.totalSignups,
              }} />
            </div>
          </div>
        </div>

        {/* Sources & Health Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <section>
            <SectionHeader>Traffic Sources</SectionHeader>
            <div className="rounded-2xl border bg-card/10 overflow-hidden p-6">
              <SourceBreakdown data={data.sourceBreakdown} />
            </div>
          </section>
          <section>
            <SectionHeader>Pipeline Health</SectionHeader>
            <div className="rounded-2xl border bg-card/10 overflow-hidden p-6">
              <EmailHealth 
                sent={data.emailsSent} 
                pending={data.pendingEmails} 
                avgDelayMinutes={data.avgEmailDelayMinutes} 
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
