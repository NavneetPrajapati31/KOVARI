// apps/admin/app/api/admin/groups/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/admin-lib/supabaseAdmin';
import { requireAdmin } from '@/admin-lib/adminAuth';
import * as Sentry from '@sentry/nextjs';
import { incrementErrorCounter } from '@/admin-lib/incrementErrorCounter';

export async function GET(req: NextRequest) {
  try {
    const { adminId, email } = await requireAdmin();
    Sentry.setUser({
      id: adminId,
      email: email,
    });
    const { searchParams } = new URL(req.url);

    const status = searchParams.get('status'); // optional
    const query = searchParams.get('query'); // optional search by name or destination
    const page = Number(searchParams.get('page') || '1');
    const limit = Number(searchParams.get('limit') || '20');
    const from = (page - 1) * limit;
    const to = from + limit - 1;

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
        created_at
      `,
      )
      .order('created_at', { ascending: false });

    if (status) {
      base = base.eq('status', status);
    }

    // Search by name or destination
    if (query) {
      base = base.or(`name.ilike.%${query}%,destination.ilike.%${query}%`);
    }

    const { data, error } = await base.range(from, to);

    if (error) {
      console.error('Groups list error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch groups' },
        { status: 500 },
      );
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

    return NextResponse.json({ page, limit, groups: groupsWithFlags });
  } catch (error) {
    await incrementErrorCounter();
    Sentry.captureException(error, {
      tags: {
        scope: 'admin-api',
        route: 'GET /api/admin/groups',
      },
    });
    throw error;
  }
}
