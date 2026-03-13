export type EmailType = "system" | "product" | "support";

export interface EmailConfig {
  email: string;
  name: string;
  replyTo: string;
}

export function getEmailConfig(type: EmailType): EmailConfig {
  const supportEmail = process.env.EMAIL_SUPPORT || "support@kovari.in";

  switch (type) {
    case "system":
      return {
        email: process.env.EMAIL_SYSTEM_FROM || "noreply@kovari.in",
        name: "Kovari", // Admin logic usually sends from Kovari
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
      return {
        email: process.env.EMAIL_SYSTEM_FROM || "noreply@kovari.in",
        name: "Kovari",
        replyTo: supportEmail,
      };
  }
}
