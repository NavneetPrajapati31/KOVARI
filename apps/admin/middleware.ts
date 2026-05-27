import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher(['/sign-in(.*)']);
const isApiRoute = createRouteMatcher(['/api(.*)']);

export default clerkMiddleware(async (auth, req) => {
  // Allow public routes
  if (isPublicRoute(req)) return;

  // Don't redirect API routes - let them handle their own authentication
  if (isApiRoute(req)) return;

  const authResult = await auth();
  const userId = authResult.userId;
  const sessionClaims = authResult.sessionClaims as any;

  if (!userId) {
    const signInUrl = new URL('/sign-in', req.url);
    signInUrl.searchParams.set('redirect_url', req.url);
    return NextResponse.redirect(signInUrl);
  }

  // SECURITY: Enforce admin role authorization
  const isAdmin = 
    sessionClaims?.metadata?.role === 'admin' ||
    sessionClaims?.public_metadata?.role === 'admin' ||
    sessionClaims?.role === 'admin';

  if (!isAdmin) {
    console.warn(`[Admin Middleware] User ${userId} attempted to access admin app without admin role.`);
    // Redirect to a 403 or unauthorized page, or just sign-in with an error
    const unauthorizedUrl = new URL('/sign-in', req.url);
    unauthorizedUrl.searchParams.set('error', 'unauthorized');
    return NextResponse.redirect(unauthorizedUrl);
  }
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)'],
};
