
import { emailLayout, button, paragraph, heading, smallText } from "./layout";

export const passwordResetEmail = ({ resetLink }: { resetLink: string }) => {
  const content = `
    ${heading("Reset your password")}
    ${paragraph("We received a request to reset your password for your Kovari account. No changes have been made to your account yet.")}
    ${paragraph("You can reset your password by clicking the link below:")}
    ${button(resetLink, "Reset Password")}
    ${smallText("If you did not request a password reset, you can safely ignore this email. This password reset link will expire in 60 minutes.")}
  `;

  return emailLayout({
    content,
    previewText: "Reset your Kovari account password",
  });
};
