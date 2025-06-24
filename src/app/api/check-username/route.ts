import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  try {
    const { username } = await req.json();
    if (!username || typeof username !== "string") {
      return NextResponse.json(
        { available: false, error: "Invalid username" },
        { status: 400 }
      );
    }

    // Clerk usernames are unique, search for user by username
    const client = await clerkClient();
    const result = await client.users.getUserList({ username: [username] });
    const users = result.data;
    const isAvailable = users.length === 0;
    return NextResponse.json({ available: isAvailable });
  } catch (error) {
    console.error("check-username error:", error);
    return NextResponse.json(
      { available: false, error: "Server error" },
      { status: 500 }
    );
  }
}
