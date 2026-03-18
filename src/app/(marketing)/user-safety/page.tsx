import { Metadata } from "next";
import SafetyContent from "./SafetyContent";

export const metadata: Metadata = {
  title: "Safety & Trust | KOVARI",
  description: "Learn about KOVARI's safety protocols, moderation processes, and community guidelines for safe solo and group travel.",
  openGraph: {
    title: "Safety & Trust | KOVARI",
    description: "Your safety is our priority. Explore our guidelines for secure travel and community interactions.",
    url: "https://kovari.app/user-safety",
    siteName: "KOVARI",
    images: [
      {
        url: "/og-safety.png", // Assuming there might be an OG image or it falls back to a default
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
};

export default function SafetyPage() {
  return <SafetyContent />;
}
