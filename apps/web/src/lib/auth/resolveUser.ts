import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { createRouteHandlerSupabaseClientWithServiceRole } from "@kovari/api";
import { verifyAccessToken, isUUIDv4 } from "./jwt";
import { AuthResult, ResolveUserOptions, AuthFailureReason } from "@/types/auth";
import { generateRequestId } from "../api/requestId";
import { logger } from "../api/logger";
import { detectClient } from "../api/clientDetection";

/**
 * 🛰️ Unified Identity Resolver
 * validate → find → provision
 */
export async function resolveUser(
  req: NextRequest,
  options: ResolveUserOptions = { mode: 'protected' }
): Promise<AuthResult> {
  const requestId = req.headers.get("x-request-id") || generateRequestId();
  const { client } = detectClient(req);

  // 1. Rate Limiting Hook (Before validation)
  // Mobile → userId-based, Web → IP-based
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  try {
    await applyRateLimit(req, client, ip, requestId);
  } catch (error) {
    logger.warn(requestId, "Rate limit exceeded", { client, ip });
    return { ok: false, reason: 'RATE_LIMIT_EXCEEDED', message: "Too many requests", requestId };
  }

  try {
    const supabase = createRouteHandlerSupabaseClientWithServiceRole();

    // 2. STAGE: VALIDATE
    let identity: { id: string; email: string; provider: 'jwt' | 'clerk' } | null = null;

    // A. Priority: Mobile JWT
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const payload = verifyAccessToken(token);

      if (payload) {
        // payload.sub is the internal UUID (for mobile users)
        identity = { id: payload.sub, email: payload.email, provider: 'jwt' };
      } else {
        logger.warn(requestId, "Invalid JWT token presented");
        if (options.mode === 'protected') {
          return { ok: false, reason: 'INVALID_TOKEN', message: "Invalid or expired token", requestId };
        }
      }
    }

    // B. Fallback: Clerk (Web)
    if (!identity) {
      const { userId: clerkUserId } = await auth();
      if (clerkUserId) {
        const clerk = await clerkClient();
        const clerkUser = await clerk.users.getUser(clerkUserId);
        
        // Final Rule: Reject if no verified primary email
        const verifiedEmail = clerkUser.emailAddresses.find(
          e => e.id === clerkUser.primaryEmailAddressId && e.verification?.status === "verified"
        )?.emailAddress;

        if (!verifiedEmail) {
          logger.warn(requestId, "Clerk identity rejected (Unverified email)", { clerkUserId });
          if (options.mode === 'protected') {
            return { ok: false, reason: 'UNVERIFIED_EMAIL', message: "Verified email required", requestId };
          }
        } else {
          identity = { id: clerkUserId, email: verifiedEmail, provider: 'clerk' };
        }
      }
    }

    // Handle Anonymous for Optional Mode
    if (!identity) {
      if (options.mode === 'optional') {
        return { ok: true, user: null as any, requestId }; // Type cast for optional null
      }
      return { ok: false, reason: 'INVALID_TOKEN', message: "Authentication required", requestId };
    }

    // 3. STAGE: ATOMIC IDENTITY SYNC (Provisioning & Self-healing)
    // We move from manual find/insert to a deterministic RPC that handles
    // concurrency and identity linking at the database level.
    const canonicalEmail = identity.email.toLowerCase().trim();
    
    const { data: userId, error: syncError } = await supabase.rpc("sync_user_identity", {
      p_email: canonicalEmail,
      p_name: identity.provider === 'clerk' ? 'Clerk User' : 'Mobile User',
      p_clerk_id: identity.provider === 'clerk' ? identity.id : null,
      p_google_id: null, 
      p_password_hash: null,
    });

    if (syncError || !userId) {
      logger.error(requestId, "Atomic identity sync failed", syncError);
      return { ok: false, reason: 'USER_NOT_FOUND', message: "Core identity sync failed", requestId };
    }

    // 4. STAGE: VERIFY & RESOLVE
    // Ensure the user exists and is not banned/deleted
    const { data: dbUser, error: fetchError } = await supabase
      .from("users")
      .select("id, email, name, isDeleted")
      .eq("id", userId)
      .single();

    if (fetchError || !dbUser) {
      logger.error(requestId, "Post-sync verification failed", fetchError);
      return { ok: false, reason: 'USER_NOT_FOUND', message: "Identity verification failed", requestId };
    }

    if (dbUser.isDeleted) {
      logger.warn(requestId, "User account is deleted", { userId: dbUser.id });
      return { ok: false, reason: 'BANNED_USER', message: "Account unavailable", requestId };
    }

    logger.info(requestId, "User resolved successfully", { userId: dbUser.id, provider: identity.provider });
    
    return {
      ok: true,
      user: {
        userId: dbUser.id,
        email: dbUser.email,
        provider: identity.provider,
        providerId: identity.id
      },
      requestId
    };

  } catch (error) {
    logger.error(requestId, "Internal failure in resolveUser", error);
    return { ok: false, reason: 'USER_NOT_FOUND', message: "Internal identity failure", requestId };
  }
}

/**
 * Placeholder for Auth Rate Limiting
 */
async function applyRateLimit(req: NextRequest, client: string, ip: string, requestId: string) {
  // Mobile → userId-based limiting (if we can peek at token)
  // Web → IP-based limiting
  // For now: Always succeed (Hook prepared)
  return true;
}
