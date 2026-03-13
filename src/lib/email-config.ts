export type EmailType = "system" | "product" | "support";

export interface EmailConfig {
  email: string;
  name: string;
  replyTo: string;
}

export function getEmailConfig(type: EmailType): EmailConfig {
  // Support email is constant across types for reply-to
  const supportEmail = process.env.EMAIL_SUPPORT || "support@kovari.in";

  switch (type) {
    case "system":
      return {
        email: process.env.EMAIL_SYSTEM_FROM || "noreply@kovari.in",
        name: "Kovari",
        replyTo: supportEmail,
      };
    case "product":
      return {
        email: process.env.EMAIL_PRODUCT_FROM || "hello@kovari.in",
        name: "Kovari",
        replyTo: supportEmail,
      };
    case "support":
      return {
        email: supportEmail,
        name: "Kovari Support",
        replyTo: supportEmail,
      };
    default:
      // Fallback to system
      return {
        email: process.env.EMAIL_SYSTEM_FROM || "noreply@kovari.in",
        name: "Kovari",
        replyTo: supportEmail,
      };
  }
}
