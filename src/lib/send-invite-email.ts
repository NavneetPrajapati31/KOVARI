import { groupInviteEmail } from "./email-templates/group-invite";
// Example: Resend (replace with your provider if needed)
import { Resend } from "resend";
import { getEmailConfig } from "./email-config";

if (!process.env.RESEND_API_KEY) {
  throw new Error("Missing RESEND_API_KEY in environment variables");
}
const resend = new Resend(process.env.RESEND_API_KEY);

export const sendInviteEmail = async ({
  to,
  groupName,
  inviteLink,
}: {
  to: string;
  groupName: string;
  inviteLink: string;
}) => {
  const systemEmailConfig = getEmailConfig("system");
  await resend.emails.send({
    from: `${systemEmailConfig.name} <${systemEmailConfig.email}>`,
    replyTo: systemEmailConfig.replyTo,
    to,
    subject: `You're invited to join ${groupName} on Kovari!`,
    html: groupInviteEmail({ groupName, inviteLink }),
  });
};
