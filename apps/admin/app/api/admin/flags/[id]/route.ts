// apps/admin/app/api/admin/flags/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/admin-lib/supabaseAdmin';
import { requireAdmin } from '@/admin-lib/adminAuth';
import * as Sentry from '@sentry/nextjs';
import { incrementErrorCounter } from '@/admin-lib/incrementErrorCounter';

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/flags/:id
 *
 * Returns full flag details including:
 * - Full flag info
 * - Target user/group profile snapshot
 * - Target's recent sessions (optional)
 */
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { adminId, email } = await requireAdmin();
    Sentry.setUser({
      id: adminId,
      email: email,
    });
  } catch (error) {
    // requireAdmin throws NextResponse for unauthorized/forbidden
    if (error instanceof NextResponse) {
      return error;
    }
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const flagId = id;

    // Try to get flag from user_flags first
    type FlagData = {
      id: string;
      user_id: string;
      reporter_id: string | null;
      type: string | null;
      reason: string | null;
      evidence_url: string | null;
      evidence_public_id: string | null;
      status: string;
      created_at: string;
      group_id?: string; // For group_flags
    };

    let flag: FlagData | null = null;
    let targetType = 'user';
    let targetId: string | null = null;

    const { data: userFlag, error: userFlagError } = await supabaseAdmin
      .from('user_flags')
      .select('*')
      .eq('id', flagId)
      .maybeSingle();

    if (userFlagError) {
      console.error('Error fetching flag from user_flags:', userFlagError);
    }

    if (userFlag) {
      flag = userFlag as FlagData;
      let flagTargetType = flag.type || 'user'; // Default to "user" if type is null

      // Normalize target type: only "group" is treated as group, everything else is "user"
      // This handles cases where type might be "test_flag", null, or other invalid values
      if (flagTargetType !== 'group') {
        flagTargetType = 'user';
      }

      // Validate target type by checking what actually exists in the database
      // If type says "group" but no group exists, treat it as a user flag
      if (flagTargetType === 'group') {
        const { data: group } = await supabaseAdmin
          .from('groups')
          .select('id')
          .eq('id', flag.user_id)
          .maybeSingle();

        if (!group) {
          console.warn(
            `Flag ${flag.id} has type="group" but group ${flag.user_id} doesn't exist. Treating as user flag.`,
          );
          flagTargetType = 'user';
        }
      }

      targetType = flagTargetType;
      targetId = flag.user_id;
    } else {
      // Try group_flags table
      try {
        const { data: groupFlag, error: groupFlagError } = await supabaseAdmin
          .from('group_flags')
          .select('*')
          .eq('id', flagId)
          .maybeSingle();

        if (groupFlagError) {
          console.error(
            'Error fetching flag from group_flags:',
            groupFlagError,
          );
        }

        if (groupFlag) {
          // Transform group_flag to match user_flag format
          flag = {
            ...groupFlag,
            user_id: groupFlag.group_id,
            type: 'group',
          } as FlagData;
          targetType = 'group';
          targetId = groupFlag.group_id;
        }
      } catch {
        // group_flags table doesn't exist
      }
    }

    if (!flag) {
      return NextResponse.json({ error: 'Flag not found' }, { status: 404 });
    }

    // Get target profile snapshot
    type TargetProfile = {
      id: string;
      userId?: string;
      name: string;
      email?: string;
      age?: number;
      gender?: string;
      nationality?: string;
      bio?: string;
      profilePhoto?: string;
      verified?: boolean;
      deleted?: boolean;
      banned?: boolean;
      banReason?: string;
      banExpiresAt?: string;
      accountCreatedAt?: string;
      destination?: string;
      description?: string;
      status?: string;
      flagCount?: number;
      createdAt?: string;
      startDate?: string;
      endDate?: string;
      isPublic?: boolean;
      budget?: number;
      coverImage?: string;
      creatorId?: string;
      membersCount?: number;
      organizer?: {
        id: string;
        name: string;
        email?: string;
        profilePhoto?: string;
        verified?: boolean;
      };
    };

    type SessionData = {
      key: string;
      [key: string]: unknown;
    };

    type ReporterInfo = {
      id: string;
      name: string;
      email?: string;
      profilePhoto?: string;
    };

    let targetProfile: TargetProfile | null = null;
    const recentSessions: SessionData[] = [];

    if (targetType === 'user') {
      // Get user profile snapshot
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select(
          `
          id,
          user_id,
          name,
          email,
          age,
          gender,
          nationality,
          bio,
          profile_photo,
          verified,
          deleted,
          users!profiles_user_id_fkey(
            id,
            banned,
            ban_reason,
            ban_expires_at,
            created_at
          )
        `,
        )
        .eq('user_id', targetId)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching target profile:', profileError);
      }

      if (profile) {
        targetProfile = {
          id: profile.id,
          userId: profile.user_id,
          name: profile.name,
          email: profile.email,
          age: profile.age,
          gender: profile.gender,
          nationality: profile.nationality,
          bio: profile.bio,
          profilePhoto: profile.profile_photo,
          verified: profile.verified,
          deleted: profile.deleted,
          banned:
            Array.isArray(profile.users) && profile.users[0]?.banned
              ? true
              : false,
          banReason: Array.isArray(profile.users)
            ? profile.users[0]?.ban_reason
            : undefined,
          banExpiresAt: Array.isArray(profile.users)
            ? profile.users[0]?.ban_expires_at
            : undefined,
          accountCreatedAt: Array.isArray(profile.users)
            ? profile.users[0]?.created_at
            : undefined,
        };
      }

      // Get target's recent sessions (optional, nice-to-have)
      try {
        const { getRedisAdminClient } = await import('@/admin-lib/redisAdmin');
        const redis = getRedisAdminClient();

        // Get clerk_user_id from users table
        const { data: userData } = await supabaseAdmin
          .from('users')
          .select('clerk_user_id')
          .eq('id', targetId)
          .maybeSingle();

        if (userData?.clerk_user_id) {
          const sessionKeys = [
            `session:${userData.clerk_user_id}`,
            `session:user:${targetId}`,
          ];

          for (const key of sessionKeys) {
            try {
              const sessionData = await redis.get(key);
              if (sessionData) {
                const parsed = JSON.parse(sessionData);
                recentSessions.push({
                  key,
                  ...parsed,
                });
              }
            } catch {
              // Session not found or invalid, continue
            }
          }
        }
      } catch (error) {
        console.error('Error fetching target sessions:', error);
        // Continue without sessions - this is optional
      }
    } else if (targetType === 'group') {
      // Get group profile snapshot
      const { data: group, error: groupError } = await supabaseAdmin
        .from('groups')
        .select(
          `
          id,
          name,
          destination,
          description,
          status,
          flag_count,
          created_at,
          start_date,
          end_date,
          is_public,
          budget,
          cover_image,
          creator_id,
          members_count
        `,
        )
        .eq('id', targetId)
        .maybeSingle();

      if (groupError) {
        console.error('Error fetching target group:', groupError);
      }

      if (group) {
        targetProfile = {
          id: group.id,
          name: group.name,
          destination: group.destination,
          description: group.description,
          status: group.status,
          flagCount: group.flag_count || 0,
          createdAt: group.created_at,
          startDate: group.start_date,
          endDate: group.end_date,
          isPublic: group.is_public,
          budget: group.budget,
          coverImage: group.cover_image,
          creatorId: group.creator_id,
          membersCount: group.members_count || 0,
        };

        // Get organizer profile if available
        if (group.creator_id) {
          const { data: organizerProfile } = await supabaseAdmin
            .from('profiles')
            .select('id, name, email, profile_photo, verified')
            .eq('user_id', group.creator_id)
            .maybeSingle();

          if (organizerProfile) {
            targetProfile.organizer = {
              id: organizerProfile.id,
              name: organizerProfile.name,
              email: organizerProfile.email,
              profilePhoto: organizerProfile.profile_photo,
              verified: organizerProfile.verified,
            };
          }
        }
      }
    }

    // Get reporter info (optional)
    let reporterInfo: ReporterInfo | null = null;
    if (flag.reporter_id) {
      const { data: reporterProfile } = await supabaseAdmin
        .from('profiles')
        .select('id, name, email, profile_photo')
        .eq('user_id', flag.reporter_id)
        .maybeSingle();

      if (reporterProfile) {
        reporterInfo = {
          id: reporterProfile.id,
          name: reporterProfile.name,
          email: reporterProfile.email,
          profilePhoto: reporterProfile.profile_photo,
        };
      }
    }

    // PHASE 6: Use original evidence URL if available
    // For public images, the original URL from Cloudinary should work fine
    // Only generate a new URL if we don't have the original URL but have a public_id
    let signedEvidenceUrl: string | null = flag.evidence_url || null;

    // If we don't have a URL but have a public_id, try to construct one
    // This should rarely happen, but handles edge cases
    if (!signedEvidenceUrl && flag.evidence_public_id) {
      try {
        const { generateSignedEvidenceUrl } =
          await import('@/admin-lib/cloudinaryEvidence');

        // Generate URL for public images (type: 'upload')
        // No transformations - just the base URL
        signedEvidenceUrl = generateSignedEvidenceUrl(flag.evidence_public_id, {
          type: 'upload', // Default to public uploads
        });
      } catch (error) {
        console.error('Error generating evidence URL from public_id:', error);
        // Continue without URL - component will handle the error
      }
    }

    return NextResponse.json({
      flag: {
        id: flag.id,
        targetType,
        targetId,
        reason: flag.reason,
        evidenceUrl: signedEvidenceUrl || flag.evidence_url, // Use signed URL if available
        evidencePublicId: flag.evidence_public_id,
        status: flag.status,
        createdAt: flag.created_at,
        reporterId: flag.reporter_id,
        // PHASE 7: Hide reporter identity from admins (optional - currently showing)
        // To hide: remove reporterId from response or set to null
      },
      targetProfile,
      reporterInfo: null, // PHASE 7: Hide reporter info (optional)
      recentSessions: recentSessions.length > 0 ? recentSessions : undefined,
    });
  } catch (error) {
    await incrementErrorCounter();
    Sentry.captureException(error, {
      tags: {
        scope: 'admin-api',
        route: 'GET /api/admin/flags/[id]',
      },
    });
    throw error;
  }
}
