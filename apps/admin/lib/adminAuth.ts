import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export async function requireAdmin() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const email = user.emailAddresses[0].emailAddress.toLowerCase();

  const allowlist = (process.env.ADMIN_ALLOWLIST || "")
    .split(",")
    .map((e) => e.trim().toLowerCase());

  if (!allowlist.includes(email)) redirect("/not-authorized");

  return { userId, email };
}
