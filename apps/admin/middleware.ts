import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher(['/sign-in(.*)']);
const isApiRoute = createRouteMatcher(['/api(.*)']);

export default clerkMiddleware(async (auth, req) => {
  // Allow public routes
  if (isPublicRoute(req)) return;

  // Don't redirect API routes - let them handle their own authentication
  if (isApiRoute(req)) return;

  const { userId } = await auth();
  if (!userId) {
    const signInUrl = new URL('/sign-in', req.url);
    signInUrl.searchParams.set('redirect_url', req.url);
    return NextResponse.redirect(signInUrl);
  }
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)'],
};
