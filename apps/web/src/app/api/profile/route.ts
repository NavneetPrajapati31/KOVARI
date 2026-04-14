import { clerkClient } from "@clerk/nextjs/server";
import { z } from "zod";
import { createAdminSupabaseClient } from "@kovari/api";
import { getAuthenticatedUser } from "@/lib/auth/get-user";
import { NextRequest, NextResponse } from "next/server";
import { generateRequestId } from "@/lib/api/requestId";
import { detectClient } from "@/lib/api/clientDetection";
import { 
  formatStandardResponse, 
  formatErrorResponse, 
  safeTransform 
} from "@/lib/api/responseHelpers";
import { profileTransformer } from "@/lib/transformers/profileTransformer";
import { ApiErrorCode, KovariClient } from "@/types/api";

const schema = z.object({
  name: z.string().min(2),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  username: z
    .string()
    .min(3)
    .max(32)
    .regex(/^[a-zA-Z0-9_]+$/),
  age: z.coerce.number().min(13).max(100),
  gender: z.enum(["Male", "Female", "Other"]),
  birthday: z.string().datetime(),
  bio: z.string().max(300),
  profile_photo: z.string().url().optional().nullable(),
  location: z.string().min(1),
  location_details: z.any().optional().nullable(),
  languages: z.array(z.string()),
  nationality: z.string(),
  job: z.string(),
  religion: z.string().min(1),
  smoking: z.string().min(1),
  drinking: z.string().min(1),
  personality: z.string().min(1),
  food_preference: z.string().min(1),
  interests: z.array(z.string()).optional().default([]),
});

/**
 * 🏛️ HARDENED PROFILE API (Phase 3 True Isolation)
 */
export async function POST(req: NextRequest) {
  const { client, error: clientError } = detectClient(req);

  // ⚡ TRUE LEGACY ISOLATION
  if (client === "web") {
    try {
      const authUser = await getAuthenticatedUser(req);
      if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      const body = await req.json();
      const supabase = createAdminSupabaseClient();
      const profileData = { user_id: authUser.id, ...body };

      await supabase.from("profiles").upsert(profileData, { onConflict: "user_id" });
      
      return NextResponse.json({ message: "Profile saved successfully" });
    } catch (err: any) {
      return NextResponse.json({ error: "Profile save failure" }, { status: 500 });
    }
  }

  // 🛡️ Standard Hardened Path
  const start = Date.now();
  const requestId = generateRequestId();

  if (clientError) {
    return formatErrorResponse(clientError, ApiErrorCode.BAD_REQUEST, requestId, 400);
  }

  return handleStandardProfile(req, requestId, start, client);
}

/**
 * Handle Standard Profile (Mobile/v1)
 */
async function handleStandardProfile(
  req: NextRequest, 
  requestId: string, 
  start: number, 
  client: KovariClient
): Promise<NextResponse> {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) return formatErrorResponse("Unauthorized", ApiErrorCode.UNAUTHORIZED, requestId, 401);

    const body = await req.json();
    const result = schema.safeParse(body);
    if (!result.success) return formatErrorResponse("Validation failed", ApiErrorCode.BAD_REQUEST, requestId, 400, result.error.flatten());

    const supabase = createAdminSupabaseClient();
    const profileData = { user_id: authUser.id, ...result.data };

    const { error: upsertError } = await supabase.from("profiles").upsert(profileData, { onConflict: "user_id" });
    if (upsertError) return formatErrorResponse("Save failed", ApiErrorCode.INTERNAL_SERVER_ERROR, requestId, 500);

    // Gate 2: Post-Transform Validation
    const transformRes = safeTransform(profileTransformer, profileData);
    if (!transformRes.ok || !transformRes.data.username) {
      return formatErrorResponse("Contract violation", ApiErrorCode.INTERNAL_SERVER_ERROR, requestId, 500);
    }

    const latencyMs = Date.now() - start;

    // Rule #6: Consistency data: { profile }
    return formatStandardResponse(
      { profile: transformRes.data },
      {},
      { requestId, latencyMs }
    );

  } catch (err: any) {
    return formatErrorResponse("Profile update failed", ApiErrorCode.INTERNAL_SERVER_ERROR, requestId, 500);
  }
}
