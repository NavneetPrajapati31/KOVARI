import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const session = req.cookies.get("admin_session")?.value;
  const isAuthPage = req.nextUrl.pathname.startsWith("/login");

  // For middleware (Edge Runtime), we only check if the session cookie exists
  // Actual Redis validation happens in API routes and page components
  if (!session) {
    if (isAuthPage) return NextResponse.next();
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // If session exists and user is on auth page, redirect to dashboard
  if (isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
