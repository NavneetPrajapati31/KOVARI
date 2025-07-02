export const groupInviteEmail = ({
  groupName,
  inviteLink,
}: {
  groupName: string;
  inviteLink: string;
}) => `
  <div style="font-family: Arial, sans-serif; background: #f9fafb; padding: 32px;">
    <div style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 12px; box-shadow: 0 2px 8px #0001; padding: 32px;">
      <h2 style="color: #1d4ed8; margin-bottom: 16px;">You're Invited to Join <span style="color: #111">${groupName}</span>!</h2>
      <p style="color: #444; margin-bottom: 24px;">
        Someone has invited you to join the group <b>${groupName}</b> on Kovari.
      </p>
      <a href="${inviteLink}" style="display: inline-block; background: #1d4ed8; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: bold; margin-bottom: 24px;">
        Accept Invitation
      </a>
      <p style="color: #888; font-size: 13px; margin-top: 24px;">
        If you did not expect this invitation, you can safely ignore this email.
      </p>
      <p style="color: #bbb; font-size: 12px; margin-top: 16px;">
        &copy; ${new Date().getFullYear()} Kovari
      </p>
    </div>
  </div>
`;
