import { emailLayout, heading, paragraph, smallText } from "./layout";

export const passwordChangedAlertEmail = () => {
  const content = `
    ${heading("Your password has been reset")}
    ${paragraph("This is a security alert to confirm that your Kovari account password has been successfully changed.")}
    ${paragraph("If you performed this action, you can safely ignore this email.")}
    
    <div style="margin: 32px 0; padding: 20px; background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
      <p style="margin: 0; color: #374151; font-size: 14px; line-height: 1.5;">
        <strong>Didn't change your password?</strong><br>
        If you did not authorize this change, please contact our security team immediately or use the forgot password flow again to secure your account.
      </p>
    </div>

    ${smallText("For your security, we have also logged out all other active sessions on your devices.")}
  `;

  return emailLayout({
    content,
    previewText: "Security Alert: Your Kovari password was changed",
  });
};
