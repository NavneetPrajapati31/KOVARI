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
  bio: z.string().max(300).optional().default(""),
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
 * 🚀 PARTIAL TO COMPLETE ATOMIC PROFILE CREATION
 * This endpoint is ONLY for the first-time profile creation after onboarding.
 */
export async function POST(req: NextRequest) {
  const start = Date.now();
  const requestId = generateRequestId();
  const { client } = detectClient(req);

  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return formatErrorResponse("Unauthorized", ApiErrorCode.UNAUTHORIZED, requestId, 401);
    }

    const body = await req.json();
    const result = schema.safeParse(body);
    
    if (!result.success) {
      return formatErrorResponse("Validation failed", ApiErrorCode.BAD_REQUEST, requestId, 400, result.error.flatten());
    }

    const supabase = createAdminSupabaseClient();

    // 🛡️ ENFORCE NO DUMMY DATA: All fields from schema must be present
    // Strip firstName and lastName as they are NOT in the database schema
    const { firstName, lastName, ...dbFields } = result.data;
    
    const profileData = {
      user_id: authUser.id,
      email: authUser.email,
      ...dbFields,
      created_at: new Date().toISOString(),
    };

    // 🔒 ATOMIC INSERT (Fail if already exists)
    const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", authUser.id)
        .maybeSingle();
    
    if (existing) {
        return formatErrorResponse("Profile already exists. Use PATCH to update.", ApiErrorCode.BAD_REQUEST, requestId, 400);
    }

    const { error: insertError } = await supabase.from("profiles").insert(profileData);
    
    if (insertError) {
      console.error("Profile insertion error:", insertError);
      return formatErrorResponse(
        `Database insertion failed: ${insertError.message} (${insertError.code})`,
        ApiErrorCode.INTERNAL_SERVER_ERROR,
        requestId,
        500,
        { details: insertError.details, hint: insertError.hint }
      );
    }

    // 🏆 Finalize Onboarding Status
    const { error: flagError } = await supabase
      .from("users")
      .update({ onboarding_completed: true })
      .eq("id", authUser.id);

    if (flagError) {
       console.error("Failed to update onboarding flag:", flagError);
       // We don't fail the whole request here as the profile IS created,
       // but we log it. In a production system, this could be a transaction.
    }

    // Gate 2: Post-Transform Validation
    const transformRes = safeTransform(profileTransformer, profileData);
    if (!transformRes.ok) {
      return formatErrorResponse("Post-creation integrity check failed", ApiErrorCode.INTERNAL_SERVER_ERROR, requestId, 500);
    }

    const latencyMs = Date.now() - start;

    return formatStandardResponse(
      { profile: transformRes.data },
      { message: "Profile created successfully" },
      { requestId, latencyMs }
    );

  } catch (err: any) {
    console.error("Atomic profile creation failure:", err);
    return formatErrorResponse("Internal system error", ApiErrorCode.INTERNAL_SERVER_ERROR, requestId, 500);
  }
}
