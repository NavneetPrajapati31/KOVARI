import nodemailer from "nodemailer";
import { groupInviteEmail } from "./email-templates/group-invite";

const transporter = nodemailer.createTransport({
  host: process.env.MAILTRAP_HOST,
  port: Number(process.env.MAILTRAP_PORT),
  auth: {
    user: process.env.MAILTRAP_USER!,
    pass: process.env.MAILTRAP_PASS!,
  },
});

export const sendInviteEmail = async ({
  to,
  groupName,
  inviteLink,
}: {
  to: string;
  groupName: string;
  inviteLink: string;
}) => {
  await transporter.sendMail({
    from: "Kovari Dev <noreply@kovari.dev>",
    to,
    subject: `You're invited to join ${groupName} on Kovari!`,
    html: groupInviteEmail({ groupName, inviteLink }),
  });
};
