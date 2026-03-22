import webpush from "web-push";

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT || "mailto:support@kovari.in";

if (publicKey && privateKey) {
  webpush.setVapidDetails(subject, publicKey, privateKey);
} else {
  console.warn("VAPID keys are not set. Push notifications will not work.");
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
}

export async function sendPushNotification(
  subscription: any,
  payload: PushPayload
) {
  try {
    const payloadString = JSON.stringify(payload);
    await webpush.sendNotification(subscription, payloadString);
    return { success: true };
  } catch (error: any) {
    if (error.statusCode === 404 || error.statusCode === 410) {
      // Subscription has expired or is no longer valid
      return { success: false, error: "expired", details: error };
    }
    console.error("Error sending push notification:", error);
    return { success: false, error: error.message, details: error };
  }
}
