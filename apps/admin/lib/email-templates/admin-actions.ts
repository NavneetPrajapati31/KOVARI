
import { emailLayout, paragraph, heading, smallText, escapeHtml } from "./layout";

// 1. User Warning Email
interface UserWarningEmailProps {
  reason?: string;
}
export const userWarningEmail = ({ reason }: UserWarningEmailProps) => {
  const content = `
    ${heading("Account Warning")}
    ${paragraph("Your account has received a warning due to a reported violation of our community guidelines.")}
    ${reason ? paragraph(`<strong>Reason:</strong> ${escapeHtml(reason)}`) : ""}
    ${paragraph("Please review our community guidelines and ensure your future behavior complies with our terms of service.")}
    ${smallText("If you have questions, please contact our support team.")}
  `;
  return emailLayout({ content, previewText: "KOVARI Account Warning" });
};

// 2. User Suspension Email
interface UserSuspensionEmailProps {
  reason?: string;
  suspendUntil: string;
}
export const userSuspensionEmail = ({ reason, suspendUntil }: UserSuspensionEmailProps) => {
  const content = `
    ${heading("Account Suspended")}
    ${paragraph("Your account has been temporarily suspended due to a reported violation of our community guidelines.")}
    ${paragraph(`<strong>Suspension Period:</strong> Until ${escapeHtml(suspendUntil)}`)}
    ${reason ? paragraph(`<strong>Reason:</strong> ${escapeHtml(reason)}`) : ""}
    ${paragraph("During this suspension period, you will not be able to access your account. Access will be automatically restored when the suspension ends.")}
    ${smallText("If you have questions, please contact our support team.")}
  `;
  return emailLayout({ content, previewText: "KOVARI Account Suspended" });
};

// 3. User Ban Email
interface UserBanEmailProps {
  reason?: string;
}
export const userBanEmail = ({ reason }: UserBanEmailProps) => {
  const content = `
    ${heading("Account Permanently Banned")}
    ${paragraph("Your account has been permanently banned due to a serious violation of our community guidelines.")}
    ${reason ? paragraph(`<strong>Reason:</strong> ${escapeHtml(reason)}`) : ""}
    ${paragraph("This ban is permanent and cannot be reversed. You will no longer be able to access your account or use our services.")}
    ${smallText("Permanent bans are issued only for severe violations.")}
  `;
  return emailLayout({ content, previewText: "KOVARI Account Banned" });
};

// 4. Group Warning Email
interface GroupWarningEmailProps {
  groupName: string;
  reason?: string;
}
export const groupWarningEmail = ({ groupName, reason }: GroupWarningEmailProps) => {
  const content = `
    ${heading("Group Warning")}
    ${paragraph(`Your group <strong>${escapeHtml(groupName)}</strong> has received a warning due to a reported violation of our community guidelines.`)}
    ${reason ? paragraph(`<strong>Reason:</strong> ${escapeHtml(reason)}`) : ""}
    ${paragraph("Please review our community guidelines and ensure your group complies with our terms of service.")}
    ${smallText("If you have questions, please contact our support team.")}
  `;
  return emailLayout({ content, previewText: `Warning for group ${groupName}` });
};

// 5. Group Removed Email
interface GroupRemovedEmailProps {
  groupName: string;
  reason?: string;
}
export const groupRemovedEmail = ({ groupName, reason }: GroupRemovedEmailProps) => {
  const content = `
    ${heading("Group Removed")}
    ${paragraph(`Your group <strong>${escapeHtml(groupName)}</strong> has been removed due to a violation of our community guidelines.`)}
    ${reason ? paragraph(`<strong>Reason:</strong> ${escapeHtml(reason)}`) : ""}
    ${paragraph("Continued violations may result in the suspension of your account.")}
    ${smallText("If you have questions, please contact our support team.")}
  `;
  return emailLayout({ content, previewText: `Group ${groupName} Removed` });
};
