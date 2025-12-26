import { requireAdminPage } from '@/admin-lib/adminAuth';
import { supabaseAdmin } from '@/admin-lib/supabaseAdmin';
import { getRedisAdminClient } from '@/admin-lib/redisAdmin';
import Link from 'next/link';
import {
  Clock,
  Flag,
  Users,
  TrendingUp,
  ArrowRight,
  Power,
  PowerOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Metrics {
  sessionsActive: number;
  pendingFlags: number;
  matches24h: number;
}

interface Settings {
  maintenance_mode: boolean;
}

interface AdminAction {
  id: string;
  action: string;
  target_type: string;
  target_id: string | null;
  reason: string | null;
  created_at: string;
  admins?:
    | {
        email: string;
      }
    | Array<{ email: string }>;
}

async function getMetrics(): Promise<Metrics> {
  let activeSessions = 0;
  let matches24h = 0;
  let pendingFlags = 0;

  // Get pending flags from both user_flags and group_flags (doesn't require Redis)
  try {
    const [{ count: userFlagsCount }, { count: groupFlagsCount }] =
      await Promise.all([
        supabaseAdmin
          .from('user_flags')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending'),
        supabaseAdmin
          .from('group_flags')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending'),
      ]);
    pendingFlags = (userFlagsCount ?? 0) + (groupFlagsCount ?? 0);
  } catch (error) {
    console.error('Error fetching pending flags:', error);
  }

  // Get Redis metrics (may fail if Redis is unavailable)
  try {
    const redis = getRedisAdminClient();

    // Ensure Redis is connected (same pattern as API route)
    if (!redis.isOpen) {
      await redis.connect();
    }

    // Get active sessions count (same logic as API route)
    try {
      // Try to use sessions:index if it exists (faster)
      const indexCount = await redis.sCard('sessions:index');
      if (indexCount > 0) {
        activeSessions = indexCount;
      } else {
        // Fallback: count session:* keys directly
        const sessionKeys = await redis.keys('session:*');
        activeSessions = sessionKeys.length;
      }
    } catch (e) {
      // If sessions:index doesn't exist or fails, count keys directly
      try {
        const sessionKeys = await redis.keys('session:*');
        activeSessions = sessionKeys.length;
      } catch (e2) {
        // Redis operation failed, but continue with other metrics
      }
    }

    // Get matches generated (24h) - from Redis counter
    try {
      const count = await redis.get('metrics:matches:daily');
      matches24h = count ? parseInt(count, 10) : 0;
    } catch (e) {
      // Silently fail - Redis may be unavailable, which is expected
    }
  } catch (error) {
    // Redis connection failed - this is OK, we'll just return 0 for Redis metrics
    // Silently fail - Redis may be unavailable, which is expected
  }

  return {
    sessionsActive: activeSessions,
    pendingFlags: pendingFlags,
    matches24h: matches24h,
  };
}

async function getTotalUsers(): Promise<number> {
  try {
    const { count, error } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('deleted', false);

    if (error) {
      console.error('Error fetching total users:', error);
      return 0;
    }

    return count ?? 0;
  } catch (error) {
    console.error('Error fetching total users:', error);
    return 0;
  }
}

async function getSettings(): Promise<Settings> {
  try {
    // Fetch settings directly from database
    const { data, error } = await supabaseAdmin
      .from('system_settings')
      .select('key, value')
      .in('key', ['maintenance_mode', 'matching_preset', 'session_ttl_hours']);

    if (error) {
      console.error('Settings fetch error:', error);
      return { maintenance_mode: false };
    }

    // Parse settings from the database format
    const settingsMap = new Map(
      data?.map((item) => [item.key, item.value]) || [],
    );

    // Extract maintenance mode value with default
    const maintenanceValue = settingsMap.get('maintenance_mode') as
      | { enabled: boolean }
      | undefined;

    return {
      maintenance_mode: maintenanceValue?.enabled ?? false,
    };
  } catch (error) {
    console.error('Error fetching settings:', error);
    return { maintenance_mode: false };
  }
}

async function getRecentActions(): Promise<AdminAction[]> {
  try {
    // Fetch recent actions directly from database
    const { data, error } = await supabaseAdmin
      .from('admin_actions')
      .select(
        `
        id,
        admin_id,
        target_type,
        target_id,
        action,
        reason,
        created_at,
        admins:admin_id (
          id,
          email
        )
      `,
      )
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching recent actions:', error);
      return [];
    }

    return (data || []).map(
      (action: {
        id: string;
        action: string;
        target_type: string;
        target_id: string | null;
        reason: string | null;
        created_at: string;
        admins?:
          | { id: string; email: string }
          | Array<{ id: string; email: string }>;
      }) => ({
        id: action.id,
        action: action.action,
        target_type: action.target_type,
        target_id: action.target_id,
        reason: action.reason,
        created_at: action.created_at,
        admins:
          Array.isArray(action.admins) && action.admins.length > 0
            ? action.admins[0]
            : action.admins,
      }),
    );
  } catch (error) {
    console.error('Error fetching recent actions:', error);
    return [];
  }
}

import { DashboardAutoRefresh } from '@/components/DashboardAutoRefresh';

export default async function DashboardPage() {
  await requireAdminPage();

  const [metrics, totalUsers, settings, recentActions] = await Promise.all([
    getMetrics(),
    getTotalUsers(),
    getSettings(),
    getRecentActions(),
  ]);

  return (
    <div className="space-y-6 p-6">
      <DashboardAutoRefresh />
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Command center overview and quick actions
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="gap-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Sessions
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.sessionsActive}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Currently active user sessions
            </p>
          </CardContent>
        </Card>

        <Card className="gap-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Flags
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center">
              <Flag className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.pendingFlags}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Flags awaiting review
            </p>
          </CardContent>
        </Card>

        <Card className="gap-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Users
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Registered users in system
            </p>
          </CardContent>
        </Card>

        <Card className="gap-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Matches (24h)
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.matches24h}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Matches generated today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link href="/flags" className="flex items-center">
                <Flag className="mr-2 h-4 w-4" />
                Go to Flags
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/sessions" className="flex items-center">
                <Clock className="mr-2 h-4 w-4" />
                Go to Sessions
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant={settings.maintenance_mode ? 'destructive' : 'outline'}
            >
              <Link href="/settings" className="flex items-center">
                {settings.maintenance_mode ? (
                  <>
                    <PowerOff className="mr-2 h-4 w-4" />
                    Disable Maintenance Mode
                  </>
                ) : (
                  <>
                    <Power className="mr-2 h-4 w-4" />
                    Toggle Maintenance Mode
                  </>
                )}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Admin Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Recent Admin Actions</CardTitle>
        </CardHeader>
        <CardContent>
          {recentActions.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-sm text-muted-foreground">
                No recent admin actions
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActions.map((action) => {
                const adminEmail =
                  Array.isArray(action.admins) && action.admins.length > 0
                    ? action.admins[0].email
                    : action.admins &&
                        typeof action.admins === 'object' &&
                        'email' in action.admins
                      ? action.admins.email
                      : 'Unknown';
                return (
                  <div
                    key={action.id}
                    className="flex items-start justify-between border-b border-border pb-3 last:border-0 last:pb-0"
                  >
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {action.action}
                        </span>
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                          {action.target_type}
                        </span>
                      </div>
                      {action.reason && (
                        <p className="text-xs text-muted-foreground">
                          {action.reason}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{adminEmail}</span>
                        <span>•</span>
                        <span>
                          {new Date(action.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {recentActions.length > 0 && (
            <div className="mt-4">
              <Button asChild variant="ghost" size="sm">
                <Link href="/audit" className="flex items-center">
                  View All Actions
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
