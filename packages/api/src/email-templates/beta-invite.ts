import { emailLayout, heading, paragraph } from "./layout";

export const betaInviteEmail = ({ recipientEmail }: { recipientEmail: string }) => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.WEB_APP_URL || (process.env.NODE_ENV === 'production' ? 'https://kovari.in' : 'http://localhost:3000');
  const signupUrl = `${baseUrl}/sign-up`;
  const content = `
    ${heading("You're in. 🎉")}
    ${paragraph("You're one of the first people to access Kovari — a space for travelers to find real travel companions, not just followers.")}
    ${paragraph("Your beta access is live. Create your account and start exploring.")}
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 32px auto;">
      <tr>
        <td style="border-radius: 16px; background: #1c4dff;">
          <a href="${signupUrl}"
             style="display: inline-block; padding: 12px 28px; font-family: 'Manrope', sans-serif; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px; letter-spacing: -0.01em;">
            Create your account →
          </a>
        </td>
      </tr>
    </table>
    <p style="margin: 0 0 24px; font-size: 13px; line-height: 26px; color: #6b7280; font-style: italic;">
      Sign up using <strong>${recipientEmail}</strong> to activate your access. A different email won't work.
    </p>
  `;

  return emailLayout({ content, previewText: "Your Kovari beta access is live." });
};
