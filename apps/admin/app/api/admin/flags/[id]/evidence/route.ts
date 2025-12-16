// apps/admin/app/api/admin/flags/[id]/evidence/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/admin-lib/adminAuth';
import { supabaseAdmin } from '@/admin-lib/supabaseAdmin';
import {
  generateSignedEvidenceUrl,
  getPublicIdFromEvidenceUrl,
} from '@/admin-lib/cloudinaryEvidence';
import * as Sentry from '@sentry/nextjs';

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/flags/:id/evidence
 *
 * Returns a signed URL for evidence access (time-limited, admin-only)
 * This endpoint ensures evidence URLs are not exposed in public APIs
 */
export async function GET(req: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof NextResponse) {
      return error;
    }
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const flagId = id;

    // Get flag from database
    const { data: flag, error: flagError } = await supabaseAdmin
      .from('user_flags')
      .select('evidence_url, evidence_public_id')
      .eq('id', flagId)
      .maybeSingle();

    if (flagError || !flag) {
      // Try group_flags
      try {
        const { data: groupFlag } = await supabaseAdmin
          .from('group_flags')
          .select('evidence_url, evidence_public_id')
          .eq('id', flagId)
          .maybeSingle();

        if (groupFlag) {
          return handleEvidenceResponse(
            groupFlag.evidence_url,
            groupFlag.evidence_public_id,
          );
        }
      } catch {
        // group_flags doesn't exist
      }

      return NextResponse.json({ error: 'Flag not found' }, { status: 404 });
    }

    return handleEvidenceResponse(flag.evidence_url, flag.evidence_public_id);
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        scope: 'admin-api',
        route: 'GET /api/admin/flags/[id]/evidence',
      },
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

function handleEvidenceResponse(
  evidenceUrl: string | null,
  evidencePublicId: string | null,
): NextResponse {
  if (!evidenceUrl && !evidencePublicId) {
    return NextResponse.json(
      { error: 'No evidence found for this flag' },
      { status: 404 },
    );
  }

  // Prefer public_id if available, otherwise extract from URL
  let publicId: string | null = evidencePublicId || null;

  if (!publicId && evidenceUrl) {
    const {
      getPublicIdFromEvidenceUrl,
    } = require('@/admin-lib/cloudinaryEvidence');
    publicId = getPublicIdFromEvidenceUrl(evidenceUrl);
  }

  if (!publicId) {
    // If we can't get public_id, return the original URL (fallback)
    // This shouldn't happen if evidence was uploaded correctly
    return NextResponse.json({
      evidenceUrl: evidenceUrl,
      signedUrl: evidenceUrl, // Fallback to original URL
      expiresIn: null,
    });
  }

  // Generate signed URL (expires in 1 hour)
  // Use "upload" type (public) to match how evidence is uploaded
  const signedUrl = generateSignedEvidenceUrl(publicId, {
    expiresIn: 3600, // 1 hour
    type: 'upload', // Explicitly use "upload" (public) type to avoid 404s
  });

  return NextResponse.json({
    evidenceUrl: evidenceUrl,
    signedUrl: signedUrl,
    expiresIn: 3600,
    expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
  });
}
