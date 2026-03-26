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
    const flagged = searchParams.get('flagged'); // optional: 'true', 'false' or empty
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
    const creatorIds = data?.map((group) => group.creator_id).filter(Boolean) || [];
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
      flagsResult.data.forEach((flag) => {
        flagCounts[flag.group_id] = (flagCounts[flag.group_id] || 0) + 1;
      });
    }

    if (profilesResult.data) {
      profilesResult.data.forEach((profile) => {
        organizerNames[profile.user_id] = profile.name || 'Unknown';
      });
    }

    // Add flag_count and organizer to each group
    const groupsEnriched =
      data?.map((group) => ({
        ...group,
        flag_count: flagCounts[group.id] || 0,
        organizer: {
          name: organizerNames[group.creator_id] || 'Unknown Organizer'
        }
      })) || [];

    return NextResponse.json({ page, limit, groups: groupsEnriched });
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
