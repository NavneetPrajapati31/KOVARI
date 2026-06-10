import { emailLayout, paragraph, heading, escapeHtml } from "./layout";

interface CustomEmailProps {
  title?: string;
  subtitle?: string;
  body: string;
}

export const customEmailTemplate = ({ title, subtitle, body }: CustomEmailProps) => {
  // Convert body newlines to HTML paragraph blocks
  const bodyParagraphs = body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      // Escape HTML to prevent malformed tags, but allow simple formatting tags or link formatting if needed
      let formatted = escapeHtml(p);
      
      // Auto-convert URLs to styled clickable links
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      formatted = formatted.replace(urlRegex, '<a href="$1" style="color: #2563eb; font-weight: 500; text-decoration: underline;" target="_blank">$1</a>');
      
      // Handle bold formatting using double asterisks **text** -> <strong>text</strong>
      formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      
      // Replace single newlines within a paragraph with <br />
      formatted = formatted.replace(/\n/g, '<br />');
      
      return paragraph(formatted);
    })
    .join("");

  const content = `
    ${title ? heading(escapeHtml(title)) : ""}
    ${subtitle ? `<p style="margin: -16px 0 24px; font-size: 15px; line-height: 22px; color: #6b7280; text-align: center;">${escapeHtml(subtitle)}</p>` : ""}
    <div style="margin-top: 24px;">
      ${bodyParagraphs}
    </div>
  `;

  // Clean up markdown markers and normalize whitespace to construct a professional inbox snippet
  const cleanBodyPreview = body
    .replace(/\*\*/g, "") // remove bold markdown
    .replace(/\s+/g, " ") // normalize whitespace/newlines
    .trim();
  const previewText = cleanBodyPreview.substring(0, 120) || "Message from Kovari";

  return emailLayout({ content, previewText });
};
