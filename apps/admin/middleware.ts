import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/sso-callback(.*)']);
const isApiRoute = createRouteMatcher(['/api(.*)']);

export default clerkMiddleware(async (auth, req) => {
  // Allow public routes
  if (isPublicRoute(req)) {
    console.log("[middleware] Public route allowed:", req.nextUrl.pathname);
    return;
  }

  // Don't redirect API routes - let them handle their own authentication
  if (isApiRoute(req)) {
    console.log("[middleware] API route allowed:", req.nextUrl.pathname);
    return;
  }

  const authResult = await auth();
  const userId = authResult.userId;
  console.log(`[middleware] Path: ${req.nextUrl.pathname}, userId: ${userId}`);

  if (!userId) {
    console.log("[middleware] No userId, redirecting to sign-in");
    const signInUrl = new URL('/sign-in', req.url);
    signInUrl.searchParams.set('redirect_url', req.url);
    return NextResponse.redirect(signInUrl);
  }

  // Admin validation is handled directly by adminAuth.ts in routes and pages
  // checking the Supabase admins table.
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)'],
};
