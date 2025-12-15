// apps/admin/app/api/admin/flags/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/admin-lib/supabaseAdmin";
import { requireAdmin } from "@/admin-lib/adminAuth";
import * as Sentry from "@sentry/nextjs";
import { incrementErrorCounter } from "@/admin-lib/incrementErrorCounter";

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
    const status = searchParams.get("status") || "pending";
    const targetType = searchParams.get("targetType") || "all"; // "all", "user", or "group"
    const page = Number(searchParams.get("page") || "1");
    const limit = Number(searchParams.get("limit") || "20");
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Fetch flags from user_flags table (handles both user and group flags)
    let userFlagsQuery = supabaseAdmin
      .from("user_flags")
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
      `
      )
      .eq("status", status);

    // Filter by targetType if specified
    if (targetType === "user") {
      userFlagsQuery = userFlagsQuery.or("type.is.null,type.eq.user");
    } else if (targetType === "group") {
      userFlagsQuery = userFlagsQuery.eq("type", "group");
    }
    // If targetType is "all", don't filter by type

    const { data: flagsData, error } = await userFlagsQuery
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Flags list error:", error);
      return NextResponse.json(
        { error: "Failed to fetch flags" },
        { status: 500 }
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
    if (targetType === "all" || targetType === "group") {
      try {
        const { data: groupFlags, error: groupFlagsError } = await supabaseAdmin
          .from("group_flags")
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
          `
          )
          .eq("status", status)
          .order("created_at", { ascending: false })
          .range(from, to);

        if (!groupFlagsError && groupFlags) {
          // Transform group_flags to match user_flags format
          groupFlagsData = (groupFlags as GroupFlagData[]).map((gf) => ({
            id: gf.id,
            user_id: gf.group_id, // Use group_id as target
            reporter_id: gf.reporter_id,
            type: "group",
            reason: gf.reason,
            evidence_url: gf.evidence_url,
            evidence_public_id: gf.evidence_public_id,
            status: gf.status,
            created_at: gf.created_at,
          }));
        }
      } catch {
        // group_flags table doesn't exist, continue with user_flags only
        console.log("group_flags table not found, using user_flags only");
      }
    }

    // Combine both user_flags and group_flags, then sort by created_at
    const allFlags = [...(flagsData || []), ...groupFlagsData].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Apply pagination to combined results
    const paginatedFlags = allFlags.slice(from, to + 1);

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
        const targetId = flag.user_id; // For user_flags, user_id is the target
        let flagTargetType = flag.type || "user"; // Default to "user" if type is null

        // Normalize target type: only "group" is treated as group, everything else is "user"
        // This handles cases where type might be "test_flag", null, or other invalid values
        if (flagTargetType !== "group") {
          flagTargetType = "user";
        }

        // Validate target type by checking what actually exists in the database
        // If type says "group" but no group exists, treat it as a user flag
        if (flagTargetType === "group") {
          const { data: group } = await supabaseAdmin
            .from("groups")
            .select("id")
            .eq("id", targetId)
            .maybeSingle();

          if (!group) {
            // Group doesn't exist, so this is actually a user flag (data inconsistency)
            console.warn(`Flag ${flag.id} has type="group" but group ${targetId} doesn't exist. Treating as user flag.`);
            flagTargetType = "user";
          }
        }

        let targetName = "Unknown";
        let targetInfo: { id: string; name: string; email?: string; profile_photo?: string } | null = null;

        if (flagTargetType === "user") {
          // Get user profile info
          const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("id, name, email, profile_photo")
            .eq("user_id", targetId)
            .maybeSingle();

          if (profile) {
            targetName = profile.name || "Unknown User";
            targetInfo = {
              id: profile.id,
              name: profile.name || "Unknown User",
              email: profile.email || undefined,
              profile_photo: profile.profile_photo || undefined,
            };
          } else {
            // Fallback: try to get from users table
            const { data: user } = await supabaseAdmin
              .from("users")
              .select("id")
              .eq("id", targetId)
              .maybeSingle();

            if (user) {
              targetName = "User (Profile Missing)";
              targetInfo = {
                id: user.id,
                name: "User (Profile Missing)",
              };
            }
          }
        } else if (flagTargetType === "group") {
          // Get group info
          const { data: group } = await supabaseAdmin
            .from("groups")
            .select("id, name")
            .eq("id", targetId)
            .maybeSingle();

          if (group) {
            targetName = group.name || "Unknown Group";
            targetInfo = {
              id: group.id,
              name: group.name || "Unknown Group",
            };
          } else {
            // Group doesn't exist - this shouldn't happen after validation above, but handle it
            targetName = "Group (Not Found)";
          }
        }

        // PHASE 6: Generate signed URL for evidence (admin-only, time-limited)
        let signedEvidenceUrl: string | null = null;
        if (flag.evidence_public_id || flag.evidence_url) {
          try {
            const { generateSignedThumbnailUrl, getPublicIdFromEvidenceUrl } = await import("@/admin-lib/cloudinaryEvidence");
            const publicId = flag.evidence_public_id || (flag.evidence_url ? getPublicIdFromEvidenceUrl(flag.evidence_url) : null);
            
            if (publicId) {
              // Generate signed thumbnail URL for table display (expires in 1 hour)
              signedEvidenceUrl = generateSignedThumbnailUrl(publicId, {
                expiresIn: 3600,
                size: 150, // Small thumbnail for table
              });
            }
          } catch (error) {
            console.error("Error generating signed evidence URL:", error);
            // Continue without signed URL - will use original URL as fallback
          }
        }

        // PHASE 8: Check if flag is older than 24 hours
        const flagAge = Date.now() - new Date(flag.created_at).getTime();
        const isOldFlag = flagAge > 24 * 60 * 60 * 1000; // 24 hours in milliseconds

        return {
          id: flag.id,
          targetType: flagTargetType,
          targetId,
          targetName,
          targetInfo,
          reason: flag.reason,
          evidenceUrl: signedEvidenceUrl || flag.evidence_url, // Use signed URL if available
          evidencePublicId: flag.evidence_public_id,
          createdAt: flag.created_at,
          status: flag.status,
          reporterId: null, // PHASE 7: Hide reporter identity from admins
          isOldFlag, // PHASE 8: Flag for highlighting old flags
        };
      })
    );

    return NextResponse.json({
      flags: enrichedFlags,
      page,
      limit,
    });
  } catch (error) {
    await incrementErrorCounter();
    Sentry.captureException(error, {
      tags: {
        scope: "admin-api",
        route: "GET /api/admin/flags",
      },
    });
    throw error;
  }
}
