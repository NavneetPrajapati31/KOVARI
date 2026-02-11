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
        { status: 400 },
      );
    }

    const { emailAddressIds } = validation.data;
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    const primaryId = clerkUser.primaryEmailAddressId ?? null;
    const userEmailIds = new Set(clerkUser.emailAddresses.map((e) => e.id));

    const removed: string[] = [];
    const failed: Array<{ id: string; reason?: string }> = [];

    for (const id of emailAddressIds) {
      if (id === primaryId) continue;
      if (!userEmailIds.has(id)) continue;

      const emailAddress = clerkUser.emailAddresses.find((e) => e.id === id);
      try {
        await client.emailAddresses.deleteEmailAddress(id);
        removed.push(id);
      } catch (err) {
        // Some email addresses cannot be deleted while they are linked to an OAuth external account
        // (Google/Facebook/Apple). In that case, we best-effort unlink the external account and retry.
        let didRetry = false;
        try {
          const linkedTo = (emailAddress as any)?.linkedTo;
          if (Array.isArray(linkedTo) && linkedTo.length > 0) {
            for (const link of linkedTo) {
              const externalAccountId =
                link && typeof link === "object" && typeof link.id === "string"
                  ? link.id
                  : null;
              const linkType =
                link &&
                typeof link === "object" &&
                typeof link.type === "string"
                  ? link.type
                  : "";

              // Only attempt to remove external accounts for OAuth / SSO links.
              // This keeps the behavior targeted and avoids unintended deletions.
              if (
                externalAccountId &&
                (linkType.startsWith("oauth_") ||
                  linkType.includes("oauth") ||
                  linkType.includes("sso") ||
                  linkType.includes("saml"))
              ) {
                try {
                  await client.users.deleteUserExternalAccount({
                    userId,
                    externalAccountId,
                  });
                } catch (unlinkErr) {
                  console.warn(
                    "Failed to unlink external account for email deletion:",
                    { emailAddressId: id, externalAccountId, linkType },
                    unlinkErr,
                  );
                  Sentry.captureException(unlinkErr, {
                    tags: {
                      endpoint: "/api/settings/remove-email-addresses",
                      op: "deleteUserExternalAccount",
                      emailAddressId: id,
                      externalAccountId,
                      linkType,
                    },
                  });
                }
              }
            }

            // Retry deleting the email address after unlinking.
            didRetry = true;
            await client.emailAddresses.deleteEmailAddress(id);
            removed.push(id);
            continue;
          }
        } catch (retryErr) {
          console.warn("Retry delete email address failed:", id, retryErr);
        }

        console.warn("Failed to delete email address:", { id, didRetry }, err);
        failed.push({
          id,
          reason: err instanceof Error ? err.message : String(err),
        });
        Sentry.captureException(err, {
          tags: {
            endpoint: "/api/settings/remove-email-addresses",
            emailAddressId: id,
            didRetry: String(didRetry),
          },
        });
      }
    }

    return NextResponse.json(
      { success: true, removed, failed },
      { status: 200 },
    );
  } catch (error) {
    console.error("Remove email addresses error:", error);
    Sentry.captureException(error, {
      tags: { endpoint: "/api/settings/remove-email-addresses" },
    });
    return NextResponse.json(
      { error: "Failed to remove email addresses" },
      { status: 500 },
    );
  }
}
