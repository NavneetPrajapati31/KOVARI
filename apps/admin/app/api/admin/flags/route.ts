// apps/admin/app/api/admin/flags/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from "@kovari/api";
import { requireAdmin } from '@/admin-lib/adminAuth';
import * as Sentry from '@sentry/nextjs';
import { incrementErrorCounter } from '@/admin-lib/incrementErrorCounter';

/**
 * GET /api/admin/flags
 *
 * Query parameters:
 * - status: Filter by status (default: "pending")
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20)
 *
 * Returns flags queue with minimal target info (user/group name)
 */
export async function GET(req: NextRequest) {
  try {
    const { adminId, email } = await requireAdmin();
    Sentry.setUser({
      id: adminId,
      email: email,
    });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'pending';
    const targetType = searchParams.get('targetType') || 'all'; // "all", "user", or "group"
    const page = Number(searchParams.get('page') || '1');
    const limit = Number(searchParams.get('limit') || '20');
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Fetch flags from user_flags table (handles both user and group flags)
    let userFlagsQuery = supabaseAdmin
      .from('user_flags')
      .select(
        `
        id,
        user_id,
        reporter_id,
        type,
        reason,
        evidence_url,
        evidence_public_id,
        status,
        created_at
      `,
      )
      .eq('status', status);

    // Filter by targetType if specified
    if (targetType === 'user') {
      userFlagsQuery = userFlagsQuery.or('type.is.null,type.eq.user');
    } else if (targetType === 'group') {
      userFlagsQuery = userFlagsQuery.eq('type', 'group');
    }
    // If targetType is "all", don't filter by type

    const { data: flagsData, error } = await userFlagsQuery
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Flags list error:', error);
      return NextResponse.json(
        { 
          error: 'Failed to fetch flags', 
          message: error.message,
          code: error.code
        },
        { status: 500 },
      );
    }

    // Also check group_flags table if it exists (for group flags)
    type GroupFlagData = {
      id: string;
      group_id: string;
      reporter_id: string | null;
      reason: string | null;
      evidence_url: string | null;
      evidence_public_id: string | null;
      status: string;
      created_at: string;
    };

    type UnifiedFlagData = {
      id: string;
      user_id: string;
      reporter_id: string | null;
      type: string | null;
      reason: string | null;
      evidence_url: string | null;
      evidence_public_id: string | null;
      status: string;
      created_at: string;
    };

    let groupFlagsData: UnifiedFlagData[] = [];
    // Only fetch from group_flags if targetType is "all" or "group"
    if (targetType === 'all' || targetType === 'group') {
      try {
        const { data: groupFlags, error: groupFlagsError } = await supabaseAdmin
          .from('group_flags')
          .select(
            `
            id,
            group_id,
            reporter_id,
            reason,
            evidence_url,
            evidence_public_id,
            status,
            created_at
          `,
          )
          .eq('status', status)
          .order('created_at', { ascending: false })
          .range(from, to);

        if (!groupFlagsError && groupFlags) {
          // Transform group_flags to match user_flags format
          groupFlagsData = (groupFlags as GroupFlagData[]).map((gf) => ({
            id: gf.id,
            user_id: gf.group_id, // Use group_id as target
            reporter_id: gf.reporter_id,
            type: 'group',
            reason: gf.reason,
            evidence_url: gf.evidence_url,
            evidence_public_id: gf.evidence_public_id,
            status: gf.status,
            created_at: gf.created_at,
          }));
        }
      } catch {
        // group_flags table doesn't exist, continue with user_flags only
        console.log('group_flags table not found, using user_flags only');
      }
    }

    // Combine both user_flags and group_flags, then sort by created_at
    const allFlags = [...(flagsData || []), ...groupFlagsData].sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return dateB - dateA;
    });

    // Apply pagination to combined results
    const paginatedFlags = allFlags.slice(from, from + limit);

    if (paginatedFlags.length === 0) {
      return NextResponse.json({
        flags: [],
        page,
        limit,
      });
    }

    // Enrich flags with target info (user/group name)
    const enrichedFlags = await Promise.all(
      paginatedFlags.map(async (flag) => {
        const targetId = flag.user_id;
        let flagTargetType = flag.type || 'user';

        if (flagTargetType !== 'group') {
          flagTargetType = 'user';
        }

        if (flagTargetType === 'group') {
          const { data: group } = await supabaseAdmin
            .from('groups')
            .select('id')
            .eq('id', targetId)
            .maybeSingle();

          if (!group) {
            flagTargetType = 'user';
          }
        }

        let targetName = 'Unknown';
        let targetInfo: {
          id: string;
          name: string;
          email?: string;
          profile_photo?: string;
        } | null = null;

        if (flagTargetType === 'user') {
          const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('id, name, email, profile_photo')
            .eq('user_id', targetId)
            .maybeSingle();

          if (profile) {
            targetName = profile.name || 'Unknown User';
            targetInfo = {
              id: profile.id,
              name: profile.name || 'Unknown User',
              email: profile.email || undefined,
              profile_photo: profile.profile_photo || undefined,
            };
          } else {
            const { data: user } = await supabaseAdmin
              .from('users')
              .select('id')
              .eq('id', targetId)
              .maybeSingle();

            if (user) {
              targetName = 'User (Profile Missing)';
              targetInfo = {
                id: user.id,
                name: 'User (Profile Missing)',
              };
            }
          }
        } else if (flagTargetType === 'group') {
          const { data: group } = await supabaseAdmin
            .from('groups')
            .select('id, name, cover_image')
            .eq('id', targetId)
            .maybeSingle();

          if (group) {
            targetName = group.name || 'Unknown Group';
            targetInfo = {
              id: group.id,
              name: group.name || 'Unknown Group',
              profile_photo: group.cover_image || undefined,
            };
          } else {
            targetName = 'Group (Not Found)';
          }
        }

        let signedEvidenceUrl: string | null = null;
        if (flag.evidence_public_id || flag.evidence_url) {
          try {
            const { generateSignedThumbnailUrl, getPublicIdFromEvidenceUrl } =
              await import('@/admin-lib/cloudinaryEvidence');

            let publicId = flag.evidence_public_id || null;

            if (!publicId && flag.evidence_url) {
              publicId = getPublicIdFromEvidenceUrl(flag.evidence_url);
            }

            if (publicId) {
              try {
                signedEvidenceUrl = generateSignedThumbnailUrl(publicId, {
                  expiresIn: 3600,
                  size: 150,
                  type: 'upload',
                });
              } catch (signError) {
                console.warn(`Failed to generate signed URL for flag ${flag.id}:`, signError);
              }
            }

            if (!signedEvidenceUrl && flag.evidence_url) {
              signedEvidenceUrl = flag.evidence_url;
            }
          } catch (error) {
            console.error('Error processing evidence URL:', error);
            signedEvidenceUrl = flag.evidence_url || null;
          }
        }

        const flagAge = Date.now() - new Date(flag.created_at).getTime();
        const isOldFlag = flagAge > 24 * 60 * 60 * 1000;

        return {
          id: flag.id,
          targetType: flagTargetType,
          targetId,
          targetName,
          targetInfo,
          reason: flag.reason,
          evidenceUrl: signedEvidenceUrl || flag.evidence_url,
          evidencePublicId: flag.evidence_public_id,
          createdAt: flag.created_at,
          status: flag.status,
          reporterId: null,
          isOldFlag,
        };
      }),
    );

    return NextResponse.json({
      flags: enrichedFlags,
      page,
      limit,
    });
  } catch (error: any) {
    console.error('CRITICAL: GET /api/admin/flags failure:', error);
    
    // Explicitly handle NextResponse throws from requireAdmin
    if (error instanceof Response || (error && error.status && typeof error.json === 'function')) {
       return error as unknown as NextResponse;
    }

    await incrementErrorCounter();
    Sentry.captureException(error, {
      tags: {
        scope: 'admin-api',
        route: 'GET /api/admin/flags',
      },
    });

    return NextResponse.json(
      { 
        error: 'Internal Server Error', 
        message: error.message || 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 },
    );
  }
}
