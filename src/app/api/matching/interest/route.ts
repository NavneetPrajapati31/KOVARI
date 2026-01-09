import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSetting } from "../../../../lib/settings";
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
    const { fromUserId, toUserId, destinationId } = body;

    if (!fromUserId || !toUserId || !destinationId) {
      return NextResponse.json(
        { success: false, error: "Missing parameters" },
        { status: 400 }
      );
    }

    // Check if demo mode is enabled
    const demoModeSetting = await getSetting("demo_mode");
    const allowMockUsers = (demoModeSetting as { enabled: boolean } | null)?.enabled || false;

    // Resolve identifiers to UUIDs if needed
    const resolve = async (identifier: string, label: string) => {
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
          console.warn(`Resolve ${label}: Rejecting mock/test user ID "${identifier}" - demo mode is disabled`);
          return null;
        }
      }

      // If it's already a UUID, return it
      const uuidRegex =
        /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
      if (uuidRegex.test(identifier)) {
        console.log(`Resolve ${label}: Identifier "${identifier}" is already a UUID`);
        return identifier;
      }
      
      console.log(`Resolve ${label}: Looking up Clerk ID "${identifier}" in users table`);
      const { data, error } = await supabaseAdmin
        .from("users")
        .select("id, clerk_user_id")
        .eq("clerk_user_id", identifier)
        .maybeSingle();
      
      if (error) {
        console.error(`Resolve ${label}: Database error looking up "${identifier}":`, error);
        throw error;
      }
      
      if (!data || !data.id) {
        console.warn(`Resolve ${label}: No user found with Clerk ID "${identifier}"`);
        return null;
      }
      
      console.log(`Resolve ${label}: Found UUID "${data.id}" for Clerk ID "${identifier}"`);
      return data.id;
    };

    const fromUuid = await resolve(fromUserId, "fromUserId");
    const toUuid = await resolve(toUserId, "toUserId");
    
    if (!fromUuid || !toUuid) {
      const missing = [];
      if (!fromUuid) missing.push(`fromUserId: "${fromUserId}"`);
      if (!toUuid) missing.push(`toUserId: "${toUserId}"`);
      
      console.error("Failed to resolve user identifiers:", { fromUserId, toUserId, missing });
      
      return NextResponse.json(
        {
          success: false,
          error: `Could not resolve user identifiers to UUIDs: ${missing.join(", ")}. Make sure both users exist in the database.`,
        },
        { status: 400 }
      );
    }

    // Prevent duplicate
    const { data: existing } = await supabaseAdmin
      .from("match_interests")
      .select("id")
      .eq("from_user_id", fromUuid)
      .eq("to_user_id", toUuid)
      .eq("destination_id", destinationId)
      .eq("match_type", "solo")
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        success: true,
        message: "Already expressed interest",
      });
    }

    const { data, error } = await supabaseAdmin
      .from("match_interests")
      .insert([
        {
          from_user_id: fromUuid,
          to_user_id: toUuid,
          destination_id: destinationId,
          match_type: "solo",
          status: "pending",
        },
      ])
      .select("id")
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message || error },
        { status: 500 }
      );
    }

    // Check reverse interest and create match if mutual
    const { data: reverse } = await supabaseAdmin
      .from("match_interests")
      .select("id")
      .eq("from_user_id", toUuid)
      .eq("to_user_id", fromUuid)
      .eq("destination_id", destinationId)
      .eq("match_type", "solo")
      .eq("status", "pending")
      .maybeSingle();

    if (reverse) {
      // Update both to accepted
      await supabaseAdmin
        .from("match_interests")
        .update({ status: "accepted" })
        .eq("from_user_id", fromUuid)
        .eq("to_user_id", toUuid)
        .eq("destination_id", destinationId)
        .eq("match_type", "solo");

      await supabaseAdmin
        .from("match_interests")
        .update({ status: "accepted" })
        .eq("from_user_id", toUuid)
        .eq("to_user_id", fromUuid)
        .eq("destination_id", destinationId)
        .eq("match_type", "solo");

      const userA = fromUuid < toUuid ? fromUuid : toUuid;
      const userB = fromUuid < toUuid ? toUuid : fromUuid;

      await supabaseAdmin.from("matches").insert([
        {
          user_a_id: userA,
          user_b_id: userB,
          destination_id: destinationId,
          match_type: "solo",
          status: "active",
        },
      ]);
    }

    return NextResponse.json({ success: true, interestId: data?.id });
  } catch (err: any) {
    console.error("/api/matching/interest error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || String(err) },
      { status: 500 }
    );
  }
}
