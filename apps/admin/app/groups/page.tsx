import { requireAdmin } from '@/admin-lib/adminAuth';
import { supabaseAdmin } from '@kovari/api';
import { AdminGroupsTable } from '../../components/AdminGroupsTable';

interface Group {
  id: string;
  name: string;
  destination: string | null;
  creator_id: string | null;
  status: string;
  flag_count: number;
  created_at: string;
  cover_image: string | null;
  organizer?: {
    name: string | null;
  } | null;
}

async function getGroups(
  page: number = 1,
  limit: number = 20,
  status?: string,
  query?: string,
  flagged?: string,
): Promise<{ groups: Group[]; page: number; limit: number }> {

  let base = supabaseAdmin
    .from('groups')
    .select(
      `
      id,
      name,
      destination,
      creator_id,
      status,
      flag_count,
      created_at,
      cover_image
    `,
    )
    .order('created_at', { ascending: false });

  if (status) {
    base = base.eq('status', status);
  }

  if (flagged === 'true') {
    base = base.gt('flag_count', 0);
  } else if (flagged === 'false') {
    base = base.eq('flag_count', 0);
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

  // Fetch flag counts and organizer names for each group
  const groupIds = (data as any[])?.map((group: any) => group.id).filter(Boolean) || [];
  const creatorIds = (data as any[])?.map((group: any) => group.creator_id).filter(Boolean) || [];
  const flagCounts: Record<string, number> = {};
  const organizerNames: Record<string, string> = {};

  const [flagsResult, profilesResult] = await Promise.all([
    groupIds.length > 0
      ? supabaseAdmin.from('group_flags').select('group_id').in('group_id', groupIds)
      : Promise.resolve({ data: [] }),
    creatorIds.length > 0
      ? supabaseAdmin.from('profiles').select('user_id, name').in('user_id', creatorIds)
      : Promise.resolve({ data: [] })
  ]);

  if (flagsResult.data) {
    (flagsResult.data as any[]).forEach((flag: any) => {
      flagCounts[flag.group_id] = (flagCounts[flag.group_id] || 0) + 1;
    });
  }

  if (profilesResult.data) {
    (profilesResult.data as any[]).forEach((profile: any) => {
      organizerNames[profile.user_id] = profile.name || 'Unknown';
    });
  }

  // Add flag_count and organizer info to each group
  const groupsEnriched =
    (data as any[])?.map((group: any) => ({
      ...group,
      flag_count: flagCounts[group.id] || 0,
      organizer: {
        name: organizerNames[group.creator_id] || 'Unknown Organizer'
      }
    })) || [];

  return {
    page,
    limit,
    groups: groupsEnriched,
  };
}

export default async function GroupsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; query?: string; flagged?: string }>;
}) {
  await requireAdmin();

  const params = await searchParams;
  const page = Number(params.page) || 1;
  const limit = 20;
  const status = params.status || '';
  const query = params.query || '';
  const flagged = params.flagged || '';

  const { groups, page: currentPage } = await getGroups(
    page,
    limit,
    status || undefined,
    query || undefined,
    flagged || undefined
  );

  return (
    <div className="max-w-full mx-auto space-y-6">
      <div className="space-y-0">
        <h1 className="text-lg font-semibold tracking-tight">Groups</h1>
        <p className="text-md text-muted-foreground">
          Manage and monitor travel groups
        </p>
      </div>

      <AdminGroupsTable
        initialGroups={groups}
        initialPage={currentPage}
        initialLimit={limit}
        initialStatus={status}
        initialQuery={query}
        initialFlagged={flagged}
      />
    </div>
  );
}
