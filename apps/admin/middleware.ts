import { NextRequest, NextResponse } from "next/server";
import redis from "@/lib/redis";

export async function middleware(req: NextRequest) {
  const session = req.cookies.get("admin_session")?.value;

  const isAuthPage = req.nextUrl.pathname.startsWith("/login");

  if (!session) {
    if (isAuthPage) return NextResponse.next();
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const data = await redis.get(session);
  if (!data) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
