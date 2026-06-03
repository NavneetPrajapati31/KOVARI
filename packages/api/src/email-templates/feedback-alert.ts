import { emailLayout } from "./layout";

interface FeedbackAlertOptions {
  type: string;
  message: string;
  pageUrl?: string;
  userEmail?: string;
  userId?: string;
  submittedAt: string;
}

export const feedbackAlertEmail = ({
  type,
  message,
  pageUrl,
  userEmail,
  userId,
  submittedAt,
}: FeedbackAlertOptions) => {
  const typeLabel =
    type === "bug" ? "Bug Report"
    : type === "suggestion" ? "Suggestion"
    : "Other";

  const content = `
    <div style="display: inline-block; font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #1d4ed8; background: #eff6ff; border-radius: 4px; padding: 3px 10px; margin-bottom: 20px;">
      Beta Feedback
    </div>

    <h1 style="font-family: 'Manrope', sans-serif; font-size: 22px; font-weight: 600; color: #0f172a; margin: 0 0 24px;">${typeLabel}</h1>

    <div style="background: #f9fafb; border-left: 3px solid #2563eb; border-radius: 0 6px 6px 0; padding: 16px 18px; margin: 0 0 24px;">
      <p style="font-family: 'Manrope', sans-serif; font-size: 15px; color: #111827; line-height: 1.65; margin: 0;">${message}</p>
    </div>

    <table style="width: 100%; border-collapse: collapse; font-family: 'Manrope', sans-serif; font-size: 13px;">
      ${pageUrl ? `
      <tr>
        <td style="padding: 8px 0; color: #6b7280; width: 120px;">Page</td>
        <td style="padding: 8px 0; color: #111827;">${pageUrl}</td>
      </tr>` : ""}
      ${userEmail ? `
      <tr>
        <td style="padding: 8px 0; color: #6b7280;">User</td>
        <td style="padding: 8px 0; color: #111827;">${userEmail}</td>
      </tr>` : ""}
      ${userId ? `
      <tr>
        <td style="padding: 8px 0; color: #6b7280;">User ID</td>
        <td style="padding: 8px 0; color: #111827; font-family: monospace;">${userId}</td>
      </tr>` : ""}
      <tr>
        <td style="padding: 8px 0; color: #6b7280;">Submitted</td>
        <td style="padding: 8px 0; color: #111827;">${submittedAt}</td>
      </tr>
    </table>
  `;

  return emailLayout({
    content,
    previewText: `[${type.toUpperCase()}] New beta feedback from ${userEmail || "a user"}`,
  });
};
