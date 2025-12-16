import { requireAdmin } from '@/admin-lib/adminAuth';
import { AdminGroupsTable } from '../../components/AdminGroupsTable';

interface Group {
  id: string;
  name: string;
  destination: string | null;
  creator_id: string | null;
  status: string;
  flag_count: number;
  created_at: string;
}

async function getGroups(
  page: number = 1,
  limit: number = 20,
  status?: string,
  query?: string,
): Promise<{ groups: Group[]; page: number; limit: number }> {
  const { supabaseAdmin } = await import('@/admin-lib/supabaseAdmin');

  let base = supabaseAdmin
    .from('groups')
    .select('id, name, destination, creator_id, status, flag_count, created_at')
    .order('created_at', { ascending: false });

  if (status) {
    base = base.eq('status', status);
  }

  if (query) {
    base = base.or(`name.ilike.%${query}%,destination.ilike.%${query}%`);
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error } = await base.range(from, to);

  if (error) {
    throw new Error('Failed to fetch groups');
  }

  // Fetch flag counts for each group
  const groupIds = data?.map((group) => group.id).filter(Boolean) || [];
  const flagCounts: Record<string, number> = {};

  if (groupIds.length > 0) {
    const { data: flagsData } = await supabaseAdmin
      .from('group_flags')
      .select('group_id')
      .in('group_id', groupIds);

    if (flagsData) {
      flagsData.forEach((flag) => {
        flagCounts[flag.group_id] = (flagCounts[flag.group_id] || 0) + 1;
      });
    }
  }

  // Add flag_count to each group (use actual count from flags table)
  const groupsWithFlags =
    data?.map((group) => ({
      ...group,
      flag_count: flagCounts[group.id] || 0,
    })) || [];

  return {
    page,
    limit,
    groups: groupsWithFlags,
  };
}

export default async function GroupsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; query?: string }>;
}) {
  await requireAdmin();

  const params = await searchParams;
  const page = Number(params.page) || 1;
  const limit = 20;
  const status = params.status || '';
  const query = params.query || '';

  const { groups, page: currentPage } = await getGroups(
    page,
    limit,
    status || undefined,
    query || undefined,
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Groups</h1>
        <p className="text-muted-foreground mt-1">
          Manage and monitor travel groups
        </p>
      </div>

      <AdminGroupsTable
        initialGroups={groups}
        initialPage={currentPage}
        initialLimit={limit}
        initialStatus={status}
        initialQuery={query}
      />
    </div>
  );
}
