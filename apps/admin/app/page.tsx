import { requireAdminPage } from '@/admin-lib/adminAuth';
import { supabaseAdmin, redis } from '@kovari/api';
import Link from 'next/link';
import {
  Clock,
  Flag,
  Users,
  TrendingUp,
  Power,
  PowerOff,
} from 'lucide-react';
import { GroupContainer } from '@/components/ui/ios/GroupContainer';
import { ListRow } from '@/components/ui/ios/ListRow';
import { SectionHeader } from '@/components/ui/ios/SectionHeader';
import { DashboardAutoRefresh } from '@/components/DashboardAutoRefresh';

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

  try {
    if (!redis.isOpen) {
      await redis.connect();
    }
    try {
      const indexCount = await redis.sCard('sessions:index');
      if (indexCount > 0) {
        activeSessions = indexCount;
      } else {
        const sessionKeys = await redis.keys('session:*');
        activeSessions = sessionKeys.length;
      }
    } catch (e) {
      try {
        const sessionKeys = await redis.keys('session:*');
        activeSessions = sessionKeys.length;
      } catch (e2) {}
    }
    try {
      const count = await redis.get('metrics:matches:daily');
      matches24h = count ? parseInt(count, 10) : 0;
    } catch (e) {}
  } catch (error) {}

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
    if (error) return 0;
    return count ?? 0;
  } catch (error) {
    return 0;
  }
}

async function getSettings(): Promise<Settings> {
  try {
    const { data, error } = await supabaseAdmin
      .from('system_settings')
      .select('key, value')
      .in('key', ['maintenance_mode', 'matching_preset', 'session_ttl_hours']);

    if (error) return { maintenance_mode: false };
    const settingsMap = new Map((data as any[])?.map((item: any) => [item.key, item.value]) || []);
    const maintenanceValue = settingsMap.get('maintenance_mode') as { enabled: boolean } | undefined;
    return { maintenance_mode: maintenanceValue?.enabled ?? false };
  } catch (error) {
    return { maintenance_mode: false };
  }
}

async function getRecentActions(): Promise<AdminAction[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('admin_actions')
      .select(`id, admin_id, target_type, target_id, action, reason, created_at, admins:admin_id (id, email)`)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) return [];
    return (data || []).map((action: any) => ({
      id: action.id,
      action: action.action,
      target_type: action.target_type,
      target_id: action.target_id,
      reason: action.reason,
      created_at: action.created_at,
      admins: Array.isArray(action.admins) && action.admins.length > 0 ? action.admins[0] : action.admins,
    }));
  } catch (error) {
    return [];
  }
}

export default async function DashboardPage() {
  await requireAdminPage();

  const [metrics, totalUsers, settings, recentActions] = await Promise.all([
    getMetrics(),
    getTotalUsers(),
    getSettings(),
    getRecentActions(),
  ]);

  return (
    <div className="max-w-full mx-auto space-y-8">
      <DashboardAutoRefresh />
      
      <div className="space-y-0">
        <h1 className="text-lg font-semibold tracking-tight">Dashboard</h1>
        <p className="text-md text-muted-foreground">
          Command center overview and quick actions
        </p>
      </div>

      <div className="space-y-8">
        <section>
          <SectionHeader>System Overview</SectionHeader>
          <GroupContainer>
            <ListRow
              icon={<Clock className="h-5 w-5" />}
              label="Active Sessions"
              secondary="Currently active user sessions"
              trailing={<span className="font-semibold text-foreground">{metrics.sessionsActive}</span>}
              showChevron={false}
            />
            <ListRow
              icon={<Flag className="h-5 w-5" />}
              label="Pending Flags"
              secondary="Flags awaiting review"
              trailing={<span className={metrics.pendingFlags > 0 ? "font-semibold text-foreground" : "text-foreground"}>{metrics.pendingFlags}</span>}
              showChevron={false}
            />
            <ListRow
              icon={<Users className="h-5 w-5" />}
              label="Total Users"
              secondary="Registered users in system"
              trailing={<span className="font-semibold text-foreground">{totalUsers}</span>}
              showChevron={false}
            />
            <ListRow
              icon={<TrendingUp className="h-5 w-5" />}
              label="Matches (24h)"
              secondary="Matches generated today"
              trailing={<span className="font-semibold text-foreground">{metrics.matches24h}</span>}
              showChevron={false}
            />
          </GroupContainer>
        </section>

        <section>
          <SectionHeader>Quick Actions</SectionHeader>
          <GroupContainer>
            <Link href="/flags" className="block">
              <ListRow
                icon={<Flag className="h-5 w-5" />}
                label="Review Flags"
                secondary="Manage user and group reports"
              />
            </Link>
            <Link href="/sessions" className="block">
              <ListRow
                icon={<Clock className="h-5 w-5" />}
                label="Monitor Sessions"
                secondary="Real-time session tracking"
              />
            </Link>
            <Link href="/settings" className="block">
              <ListRow
                icon={settings.maintenance_mode ? <PowerOff className="h-5 w-5" /> : <Power className="h-5 w-5" />}
                label="Maintenance Mode"
                secondary={settings.maintenance_mode ? "Maintenance is currently active" : "System is running normally"}
                trailing={
                  <span className={settings.maintenance_mode ? "text-red-500 font-medium" : "text-emerald-500 font-medium"}>
                    {settings.maintenance_mode ? "Active" : "Off"}
                  </span>
                }
              />
            </Link>
          </GroupContainer>
        </section>

        <section>
          <SectionHeader>Recent Admin Actions</SectionHeader>
          <GroupContainer>
            {recentActions.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-[15px]">
                No recent admin actions
              </div>
            ) : (
              recentActions.map((action) => {
                const adminEmail = typeof action.admins === 'object' && action.admins !== null && 'email' in action.admins 
                  ? action.admins.email 
                  : 'Unknown';
                
                return (
                  <ListRow
                    key={action.id}
                    label={action.action}
                    secondary={`${adminEmail} • ${new Date(action.created_at).toLocaleDateString()}`}
                    trailing={
                      <div className="flex flex-col items-end">
                        <span className="text-sm uppercase tracking-wider font-medium text-muted-foreground">{action.target_type}</span>
                        <span className="text-sm text-muted-foreground">{new Date(action.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    }
                    showChevron={false}
                  />
                );
              })
            )}
            {recentActions.length > 0 && (
              <Link href="/audit" className="block">
                <div className="px-4 py-3 text-center border-none hover:bg-secondary transition-colors">
                  <span className="text-sm font-medium text-primary">View All Actions</span>
                </div>
              </Link>
            )}
          </GroupContainer>
        </section>
      </div>
    </div>
  );
}