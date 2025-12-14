import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { ensureRedisConnection } from "@/lib/redis";
import { supabaseAdmin } from "@/admin-lib/supabaseAdmin";
import { logAdminAction } from "@/admin-lib/logAdminAction";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    // Check if environment variables are set
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.error(
        "ADMIN_EMAIL or ADMIN_PASSWORD not set in environment variables"
      );
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const validAdmins = [
      {
        email: adminEmail,
        password: adminPassword,
        role: "super_admin",
      },
    ];

    const admin = validAdmins.find(
      (u) => u.email === email && u.password === password
    );

    if (!admin) {
      console.log("Login attempt failed:", {
        email,
        providedPassword: password ? "***" : "missing",
      });
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Store session
    const redisClient = await ensureRedisConnection();
    const sessionId = `admin:${randomUUID()}`;
    await redisClient.setEx(sessionId, 60 * 60 * 6, JSON.stringify(admin));

    // Get adminId from Supabase admins table for logging
    const { data: adminData } = await supabaseAdmin
      .from("admins")
      .select("id")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    // Log admin login action
    if (adminData?.id) {
      await logAdminAction({
        adminId: adminData.id,
        targetType: "admin",
        targetId: adminData.id,
        action: "LOGIN_ADMIN",
        reason: null,
        metadata: {
          email: email.toLowerCase(),
        },
      }).catch((err) => {
        // Don't fail login if logging fails
        console.error("Failed to log admin login:", err);
      });
    }

    const res = NextResponse.json({ success: true });
    res.cookies.set("admin_session", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return res;
  } catch (error) {
    console.error("Login route error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
