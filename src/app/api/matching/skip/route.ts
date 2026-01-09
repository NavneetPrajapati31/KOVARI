import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSetting } from "@/lib/settings";
import { createHash } from "crypto";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

/**
 * Generate a deterministic UUID for mock users based on their ID
 * This allows mock users to have consistent UUIDs for demo purposes
 */
function generateMockUserUuid(mockUserId: string): string {
  // Create a deterministic hash from the mock user ID
  const hash = createHash("sha256").update(`mock_user_${mockUserId}`).digest("hex");
  // Format as UUID v4 (but deterministic)
  return `${hash.substring(0, 8)}-${hash.substring(8, 12)}-4${hash.substring(13, 16)}-${hash.substring(16, 20)}-${hash.substring(20, 32)}`;
}

/**
 * Check if an identifier is a mock user (e.g., "user_mumbai_1")
 * Real Clerk IDs are long alphanumeric strings, mock users have descriptive names
 */
function isMockUser(identifier: string): boolean {
  if (!identifier || !identifier.startsWith("user_")) return false;
  
  // Mock users have patterns like: user_mumbai_1, user_test_1, user_august_1
  // They contain lowercase letters, numbers, and underscores after "user_"
  // Real Clerk IDs are longer random alphanumeric strings
  const mockUserPattern = /^user_[a-z][a-z0-9_]*$/;
  return mockUserPattern.test(identifier);
}

/**
 * Ensure a mock user exists in the database with the given UUID
 * This is required for foreign key constraints
 */
async function ensureMockUserExists(mockUserId: string, mockUuid: string): Promise<boolean> {
  try {
    // Check if user already exists
    const { data: existing } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("id", mockUuid)
      .maybeSingle();

    if (existing) {
      console.log(`🎬 Mock user "${mockUserId}" already exists with UUID "${mockUuid}"`);
      return true;
    }

    // Create the mock user record (only required fields: id, clerk_user_id, created_at)
    const { data, error } = await supabaseAdmin
      .from("users")
      .insert([
        {
          id: mockUuid,
          clerk_user_id: mockUserId,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error(`Failed to create mock user "${mockUserId}":`, error);
      return false;
    }

    console.log(`✅ Created mock user "${mockUserId}" with UUID "${mockUuid}"`);
    return true;
  } catch (error) {
    console.error(`Error ensuring mock user exists:`, error);
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { skipperId, skippedUserId, destinationId, type = "solo" } = body;

    if (!skipperId || !skippedUserId || !destinationId) {
      console.error("Skip API: Missing parameters", {
        skipperId,
        skippedUserId,
        destinationId,
      });
      return NextResponse.json(
        { success: false, error: "Missing parameters" },
        { status: 400 }
      );
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
      console.error("Skip API: Missing Supabase environment variables");
      return NextResponse.json(
        { success: false, error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Check if demo mode is enabled
    const demoModeSetting = await getSetting("demo_mode");
    const allowMockUsers = (demoModeSetting as { enabled: boolean } | null)?.enabled || false;

    // Resolve identifiers to UUIDs if needed
    const resolve = async (identifier: string) => {
      // Handle mock/test users in demo mode (only treat descriptive IDs like "user_mumbai_1" as mock users)
      if (identifier && isMockUser(identifier)) {
        if (allowMockUsers) {
          // Generate a deterministic UUID for mock users
          const mockUuid = generateMockUserUuid(identifier);
          console.log(`🎬 Demo mode: Using virtual UUID "${mockUuid}" for mock user "${identifier}"`);
          
          // Ensure the mock user exists in the database (required for foreign keys)
          const created = await ensureMockUserExists(identifier, mockUuid);
          if (!created) {
            console.error(`Failed to ensure mock user "${identifier}" exists in database`);
            return null;
          }
          
          return mockUuid;
        } else {
          console.warn(`Rejecting mock/test user ID "${identifier}" - demo mode is disabled`);
          return null;
        }
      }

      // If it's already a UUID, return it
      const uuidRegex =
        /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
      if (uuidRegex.test(identifier)) return identifier;
      
      const { data, error } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("clerk_user_id", identifier)
        .maybeSingle();
      if (error) throw error;
      return data?.id || null;
    };

    const skipperUuid = await resolve(skipperId);
    if (!skipperUuid) {
      console.error("Skip API: Failed to resolve skipper UUID", {
        skipperId,
        skipperUuid,
      });
      return NextResponse.json(
        {
          success: false,
          error: "Could not resolve skipper identifier to UUID",
        },
        { status: 400 }
      );
    }

    let skippedEntityId: string;
    
    if (type === "group") {
      // For group skips, skippedUserId is already a group UUID
      // After migration, match_skips.skipped_user_id can store both user and group IDs
      skippedEntityId = skippedUserId;
      console.log("Processing group skip", {
        skipperUuid,
        groupId: skippedEntityId,
        destinationId,
      });
    } else {
      // For solo skips, resolve the user ID
      const skippedUuid = await resolve(skippedUserId);
      if (!skippedUuid) {
        console.error("Skip API: Failed to resolve skipped user UUID", {
          skippedUserId,
        });
        return NextResponse.json(
          {
            success: false,
            error: "Could not resolve skipped user identifier to UUID",
          },
          { status: 400 }
        );
      }
      skippedEntityId = skippedUuid;
    }

    // Check for duplicate skip
    const { data: existing } = await supabaseAdmin
      .from("match_skips")
      .select("id")
      .eq("user_id", skipperUuid)
      .eq("skipped_user_id", skippedEntityId)
      .eq("destination_id", destinationId)
      .eq("match_type", type)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        success: true,
        message: `Already skipped this ${type === "group" ? "group" : "profile"}`,
      });
    }

    // Insert skip record (works for both solo and group)
    const { data, error } = await supabaseAdmin
      .from("match_skips")
      .insert([
        {
          user_id: skipperUuid,
          skipped_user_id: skippedEntityId,
          destination_id: destinationId,
          match_type: type,
        },
      ])
      .select("id")
      .single();

    if (error) {
      console.error("Skip API: Database insert error", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        type,
      });
      return NextResponse.json(
        { success: false, error: error.message || String(error) },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      skipId: data?.id,
    });
  } catch (error: any) {
    console.error("Skip API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to create skip record",
      },
      { status: 500 }
    );
  }
}
