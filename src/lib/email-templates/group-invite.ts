
import { emailLayout, button, paragraph, heading, smallText, escapeHtml } from "./layout";

interface GroupInviteEmailProps {
  groupName: string;
  inviteLink: string;
  senderName?: string;
}

export const groupInviteEmail = ({
  groupName,
  inviteLink,
  senderName = "Someone",
}: GroupInviteEmailProps) => {
  const content = `
    ${heading(`Join ${escapeHtml(groupName)}`)}
    ${paragraph(`<strong>${escapeHtml(senderName)}</strong> has invited you to join the group <strong>${escapeHtml(groupName)}</strong> on Kovari. Plan trips and collaborate with your travel mates in one place.`)}
    ${button(inviteLink, "Accept Invitation")}
    ${smallText("If you were not expecting this invitation, you can simply ignore this email.")}
  `;

  return emailLayout({
    content,
    previewText: `${senderName} invited you to join ${groupName} on Kovari`,
  });
};
