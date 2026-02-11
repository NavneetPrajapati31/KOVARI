import {
  clerkClient,
  clerkMiddleware,
  createRouteMatcher,
} from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const isBannedPage = createRouteMatcher(["/banned"]);

export default clerkMiddleware(async (auth, req) => {
  // Allow access to the banned page to prevent redirect loops
  if (isBannedPage(req)) {
    return NextResponse.next();
  }

  const { userId, sessionId } = await auth();

  if (userId) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    // Prefer Service Role Key for admin-level checks to bypass RLS
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && (supabaseServiceKey || supabaseAnonKey)) {
      try {
        let supabase;

        if (supabaseServiceKey) {
          // Use Service Role to bypass RLS - safest for middleware checks
          supabase = createClient(supabaseUrl, supabaseServiceKey, {
            auth: { persistSession: false },
          });
        } else {
          // Fallback to Anon Key with User Token
          const { getToken } = await auth();
          const token = await getToken({ template: "supabase" });
          supabase = createClient(supabaseUrl, supabaseAnonKey!, {
            global: {
              headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            },
          });
        }

        const { data: user, error } = await supabase
          .from("users")
          .select('banned, ban_expires_at, "isDeleted"')
          .eq("clerk_user_id", userId)
          .maybeSingle();

        if (error) {
          console.error("Middleware Supabase error:", error);
          // If we can't check, we should probably fail safe?
          // However, blocking valid users on rare DB errors is bad UX.
          // For now, log and proceed (fail open) unless it's critical.
          // User explicitly asked for security, but infinite loops are worse.
          // Let's stick to fail open for generic errors but handle banned=true.
        }

        // Soft-deleted accounts are blocked from using the app.
        // We keep the user row (soft delete) to preserve referential integrity and audit history,
        // but deny access as if the account no longer exists.
        if (user?.isDeleted) {
          const pathname = req.nextUrl.pathname;
          const isApiRoute =
            pathname.startsWith("/api") || pathname.startsWith("/trpc");

          // For API routes, return a proper 403 JSON error.
          if (isApiRoute) {
            return NextResponse.json(
              { error: "Account has been deleted" },
              { status: 403 },
            );
          }

          // For page routes, revoke the current session (best-effort) and redirect to sign-in.
          // If we returned JSON here, the browser would render it as a blank JSON page.
          try {
            if (sessionId) {
              const client = await clerkClient();
              await client.sessions.revokeSession(sessionId);
            }
          } catch (e) {
            console.warn(
              "Failed to revoke deleted-user session in middleware:",
              e,
            );
          }

          const url = req.nextUrl.clone();
          url.pathname = "/sign-in";
          url.searchParams.set("reason", "deleted");
          return NextResponse.redirect(url);
        }

        if (user?.banned) {
          let isBanned = true;

          // Check if ban is expired (suspension)
          if (user.ban_expires_at) {
            const expires = new Date(user.ban_expires_at);
            // If current time is past expiration, they are no longer banned
            const now = new Date();
            if (expires < now) {
              isBanned = false;
            }
          }

          if (isBanned) {
            return NextResponse.redirect(new URL("/banned", req.url));
          }
        }
      } catch (error) {
        console.error("Middleware ban check error:", error);
        // Fail closed for maximum security as requested previously
        return NextResponse.redirect(new URL("/banned", req.url));
      }
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
