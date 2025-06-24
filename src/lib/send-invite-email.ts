import { groupInviteEmail } from "./email-templates/group-invite";
// Example: Resend (replace with your provider if needed)
import { Resend } from "resend";

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
  await resend.emails.send({
    from: "Kovari <noreply@yourdomain.com>",
    to,
    subject: `You're invited to join ${groupName} on Kovari!`,
    html: groupInviteEmail({ groupName, inviteLink }),
  });
};
