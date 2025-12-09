import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ensureRedisConnection } from "@/lib/redis";

export default async function AdminDashboard() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("admin_session")?.value;

  if (!sessionId) {
    redirect("/login");
  }

  // Validate session in Redis
  const redis = await ensureRedisConnection();
  const sessionData = await redis.get(sessionId);
  if (!sessionData) {
    redirect("/login");
  }

  const admin = JSON.parse(sessionData);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      <p className="text-gray-600">Welcome, {admin.email}</p>
    </div>
  );
}
