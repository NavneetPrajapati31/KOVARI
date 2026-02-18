
import { BiParagraph } from "react-icons/bi";
import { emailLayout, paragraph, heading, smallText } from "./layout";

export const waitlistConfirmationEmail = () => {
  const content = `
    ${paragraph("Hey,")}
    ${paragraph("You're on the KOVARI waitlist — appreciate you getting in early.")}
    ${paragraph("We're building this for people who don’t want to plan trips in messy WhatsApp groups or travel with random people.")}
    ${paragraph("We’ll be opening access soon in small batches.")}
    ${paragraph("Quick question — where are you planning to travel next?")}
  `;

  return emailLayout({
    content,
    previewText: "We appreciate you getting in early.",
    hideLogo: true,
  });
};
