const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = typeof window !== "undefined" ? window.atob(base64) : "";
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return null;

  try {
    const registration = await navigator.serviceWorker.register("/service-worker.js");
    return registration;
  } catch (err) {
    console.error("Service worker registration failed:", err);
    return null;
  }
}

export async function subscribeUserToPush() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator) || !VAPID_PUBLIC_KEY) return null;

  try {
    const registration = await navigator.serviceWorker.ready;
    
    let subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      await sendSubscriptionToServer(subscription);
      return subscription;
    }

    const convertedVapidKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
    
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedVapidKey,
    });

    await sendSubscriptionToServer(subscription);
    return subscription;
  } catch (err) {
    console.error("Failed to subscribe user to push:", err);
    return null;
  }
}

async function sendSubscriptionToServer(subscription: PushSubscription) {
  try {
    const response = await fetch("/api/notifications/subscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(subscription),
    });

    if (!response.ok) {
      throw new Error("Failed to send subscription to server");
    }
  } catch (err) {
    console.error("Error sending push subscription to server:", err);
  }
}
