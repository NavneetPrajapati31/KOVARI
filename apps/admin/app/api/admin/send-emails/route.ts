import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/admin-lib/adminAuth";
import { logAdminAction } from "@/admin-lib/logAdminAction";
import { sendEmail } from "@/admin-lib/send-email";
import { customEmailTemplate } from "@/admin-lib/email-templates/custom-email";
import * as Sentry from "@sentry/nextjs";
import { incrementErrorCounter } from "@/admin-lib/incrementErrorCounter";

export async function POST(req: NextRequest) {
  let adminId: string;
  let adminEmail: string;

  // 1. Authenticate admin
  try {
    const admin = await requireAdmin();
    adminId = admin.adminId;
    adminEmail = admin.email;
    Sentry.setUser({
      id: adminId,
      email: adminEmail,
    });
  } catch (error) {
    if (error instanceof NextResponse) {
      return error;
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { subject, title, subtitle, emailBody, recipients } = body as {
      subject: string;
      title?: string;
      subtitle?: string;
      emailBody: string;
      recipients: string[];
    };

    // Validation
    if (!subject || !subject.trim()) {
      return NextResponse.json({ error: "Subject is required" }, { status: 400 });
    }
    if (!emailBody || !emailBody.trim()) {
      return NextResponse.json({ error: "Body content is required" }, { status: 400 });
    }
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({ error: "At least one recipient is required" }, { status: 400 });
    }

    // Generate HTML using custom email template
    const html = customEmailTemplate({
      title: title?.trim() || undefined,
      subtitle: subtitle?.trim() || undefined,
      body: emailBody.trim(),
    });

    const cleanRecipients = Array.from(
      new Set(recipients.map((email) => email.toLowerCase().trim()).filter(Boolean))
    );

    const results = {
      sent: 0,
      failed: [] as { email: string; error: string }[],
    };

    // Process in batches of 10 to balance speed and prevent rate limiting / request timeout
    const batchSize = 10;
    for (let i = 0; i < cleanRecipients.length; i += batchSize) {
      const batch = cleanRecipients.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (email) => {
          try {
            const res = await sendEmail({
              to: email,
              subject: subject.trim(),
              html,
              category: "custom_campaign",
            });
            if (res.success) {
              results.sent++;
            } else {
              results.failed.push({ email, error: res.error || "Unknown Brevo error" });
            }
          } catch (err: any) {
            results.failed.push({ email, error: err.message || "Failed to process" });
          }
        })
      );
    }

    // 3. Log action to admin_actions
    await logAdminAction({
      adminId,
      targetType: "bulk_email",
      targetId: null,
      action: "SEND_BULK_EMAIL",
      reason: `Sent "${subject}" to ${cleanRecipients.length} recipients`,
      metadata: {
        subject: subject.trim(),
        title: title?.trim() || null,
        subtitle: subtitle?.trim() || null,
        recipientCount: cleanRecipients.length,
        sentCount: results.sent,
        failedCount: results.failed.length,
        failedRecipients: results.failed,
      },
    });

    return NextResponse.json({
      success: true,
      sentCount: results.sent,
      failedCount: results.failed.length,
      failedRecipients: results.failed,
    });
  } catch (error) {
    await incrementErrorCounter();
    Sentry.captureException(error, {
      tags: {
        scope: "admin-api",
        route: "POST /api/admin/send-emails",
      },
    });
    console.error("Bulk email error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
