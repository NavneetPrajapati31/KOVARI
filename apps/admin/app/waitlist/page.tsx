"use client";

import { useEffect, useState } from "react";
import { 
  Users, 
  Mail, 
  MousePointerClick, 
  TrendingUp,
  RefreshCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/admin/MetricCard";
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
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center mb-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-[400px] w-full rounded-xl" />
          <Skeleton className="h-[400px] w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Waitlist Analytics</h1>
          <p className="text-muted-foreground">Monitor growth and email pipeline health</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchAnalytics}
          disabled={isRefreshing}
          className="rounded-full gap-2 transition-all"
        >
          <RefreshCcw className={isRefreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          {isRefreshing ? "Refreshing..." : "Refresh Data"}
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Signups"
          value={data.totalSignups.toLocaleString()}
          icon={Users}
          description="vs last 30 days"
          trend={{ value: Math.abs(data.signupTrend), isPositive: data.signupTrend >= 0 }}
        />
        <MetricCard
          title="Conversion Rate"
          value={`${data.conversionRate}%`}
          icon={TrendingUp}
          description="Views to signup ratio"
        />
        <MetricCard
          title="Emails Sent"
          value={`${Math.round((data.emailsSent / (data.totalSignups || 1)) * 100)}%`}
          icon={Mail}
          description="Confirmation delivery rate"
        />
         <MetricCard
          title="Avg. Delay"
          value={`${data.avgEmailDelayMinutes}m`}
          icon={MousePointerClick}
          description="Creation to delivery time"
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GrowthChart data={data.dailySignups} />
        <Funnel data={{
          views: data.landingViews,
          clicks: data.waitlistClicks,
          submissions: data.totalSignups,
        }} />
      </div>

      {/* Bottom Insights Row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <SourceBreakdown data={data.sourceBreakdown} />
        <EmailHealth 
          sent={data.emailsSent} 
          pending={data.pendingEmails} 
          avgDelayMinutes={data.avgEmailDelayMinutes} 
        />
      </div>
    </div>
  );
}
