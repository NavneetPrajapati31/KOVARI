import { NextResponse } from "next/server";
import redis from "@/lib/redis"; // use your existing redis wrapper

export async function POST(req: Request) {
  const { email, password } = await req.json();

  const validAdmins = [
    {
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
      role: "super_admin",
    },
  ];

  const admin = validAdmins.find(
    (u) => u.email === email && u.password === password
  );

  if (!admin) return NextResponse.json({ error: "Invalid" }, { status: 401 });

  // Store session
  const sessionId = `admin:${crypto.randomUUID()}`;
  await redis.setEx(sessionId, 60 * 60 * 6, JSON.stringify(admin));

  const res = NextResponse.json({ success: true });
  res.cookies.set("admin_session", sessionId, { httpOnly: true });

  return res;
}
