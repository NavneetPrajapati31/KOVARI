import { type Metadata } from "next";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/next";

if (process.env.NEXT_PUBLIC_DEV_THEME === "true") {
  try {
    require("@/styles/dev-theme.css");
  } catch {
    console.warn("⚠️ dev-theme.css not found. Skipping dev theme.");
  }
} else {
  require("@/styles/globals.css");
}

import { Poppins, Inter } from "next/font/google";
import { Toaster } from "@/shared/components/ui/sonner";
import { HeroUIProvider } from "@heroui/react";
import { AuthProvider } from "@/shared/components/auth-provider";

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://kovari.vercel.app"),
  title: {
    default: "KOVARI | Travel and Connect with Like-Minded People",
    template: "%s | KOVARI",
  },
  description: "Join KOVARI to connect, plan, and travel with like-minded individuals. Discover new destinations and build meaningful connections in a trusted community.",
  keywords: [
    "travel community",
    "travel groups",
    "connect with travelers",
    "like-minded travelers",
    "travel companionship",
    "trip planning",
    "backpacking groups",
    "KOVARI",
  ],
  authors: [{ name: "Team KOVARI" }],
  creator: "Team KOVARI",
  publisher: "KOVARI",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "KOVARI | Travel and Connect with Like-Minded People",
    description: "Join KOVARI to connect, plan, and travel with like-minded individuals. Discover new destinations and build meaningful connections.",
    siteName: "KOVARI",
  },
  twitter: {
    card: "summary_large_image",
    title: "KOVARI | Travel and Connect",
    description: "Join KOVARI to connect, plan, and travel with like-minded individuals.",
    creator: "@KovariApp",
  },
  alternates: {
    canonical: "/",
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <link
            href="https://api.fontshare.com/v2/css?f[]=clash-display@200,300,400,500,600,700&display=swap"
            rel="stylesheet"
          />
          <link
            href="https://fonts.googleapis.com/css2?family=Manrope:wght@200;300;400;500;600;700;800&display=swap"
            rel="stylesheet"
          />
        </head>
        <body className={`${inter.variable} ${poppins.variable} font-body`}>
          <HeroUIProvider>
            <AuthProvider>{children}</AuthProvider>
            <Toaster
              position="bottom-right"
              duration={2500}
              toastOptions={{
                style: {
                  background: "black",
                  color: "white",
                  border: "none",
                },
              }}
            />
            <Analytics />
          </HeroUIProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
