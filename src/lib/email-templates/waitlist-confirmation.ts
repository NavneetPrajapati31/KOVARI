
import { BiParagraph } from "react-icons/bi";
import { emailLayout, paragraph, heading, smallText } from "./layout";

export const waitlistConfirmationEmail = () => {
  const content = `
    ${heading("You're on the list! 🚀")}
    ${paragraph("Thanks for joining the Kovari waitlist. We're thrilled to have you with us.")}
    ${paragraph("We're building the ultimate platform to help you match with the right people, plan trips together, and explore safely — without the chaos.")}
    ${paragraph("We'll be in touch soon with exclusive updates and early access.")}
    ${smallText("Stay tuned for more updates!")}
  `;

  return emailLayout({
    content,
    previewText: "You are now on the Kovari waitlist!",
  });
};
