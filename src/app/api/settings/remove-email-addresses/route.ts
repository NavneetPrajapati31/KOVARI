import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { z } from "zod";
import * as Sentry from "@sentry/nextjs";

const schema = z.object({
  emailAddressIds: z.array(z.string().min(1)).max(10),
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validation = schema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request: emailAddressIds array required" },
        { status: 400 }
      );
    }

    const { emailAddressIds } = validation.data;
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    const primaryId = clerkUser.primaryEmailAddressId ?? null;
    const userEmailIds = new Set(
      clerkUser.emailAddresses.map((e) => e.id)
    );

    for (const id of emailAddressIds) {
      if (id === primaryId) continue;
      if (!userEmailIds.has(id)) continue;
      try {
        await client.emailAddresses.deleteEmailAddress(id);
      } catch (err) {
        console.warn("Failed to delete email address:", id, err);
        Sentry.captureException(err, {
          tags: { endpoint: "/api/settings/remove-email-addresses", emailAddressId: id },
        });
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Remove email addresses error:", error);
    Sentry.captureException(error, {
      tags: { endpoint: "/api/settings/remove-email-addresses" },
    });
    return NextResponse.json(
      { error: "Failed to remove email addresses" },
      { status: 500 }
    );
  }
}
