import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const isBannedPage = createRouteMatcher(["/banned"]);

export default clerkMiddleware(async (auth, req) => {
  // Allow access to the banned page to prevent redirect loops
  if (isBannedPage(req)) {
     return NextResponse.next();
  }

  const { userId } = await auth();

  if (userId) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);

      try {
        const { data: user } = await supabase
          .from("users")
          .select("banned, ban_expires_at")
          .eq("clerk_user_id", userId)
          .maybeSingle();

        if (user?.banned) {
          let isBanned = true;

          // Check if ban is expired (suspension)
          if (user.ban_expires_at) {
            const expires = new Date(user.ban_expires_at);
            // If current time is past expiration, they are no longer banned
            if (expires < new Date()) {
              isBanned = false;
            }
          }

          if (isBanned) {
            return NextResponse.redirect(new URL("/banned", req.url));
          }
        }
      } catch (error) {
        console.error("Middleware ban check error:", error);
        // Fail closed for maximum security: if we can't verify ban status, block access.
        // This prevents banned users from infiltrating during a database outage.
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
