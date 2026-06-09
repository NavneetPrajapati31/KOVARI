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

import "@/styles/globals.css";

import { Poppins, Inter } from "next/font/google";
import { Toaster } from "@/shared/components/ui/sonner";
import { HeroUIProvider } from "@heroui/react";
import { AuthProvider } from "@/shared/components/auth-provider";
import { ThemeProvider } from "@/shared/components/providers/theme-provider";

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
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://www.kovari.in"),
  title: {
    default: "Kovari | Connect & Travel With the Right People",
    template: "%s | Kovari",
  },
  description: "The modern social travel platform. Skip the guesswork—match with like-minded travelers, plan trips together, and explore destinations safely.",
  keywords: [
    "social travel app",
    "find travel companions",
    "group trip planner",
    "travel community",
    "like-minded travelers",
    "solo traveler networking",
    "safe travel groups",
    "Kovari",
  ],
  authors: [{ name: "Kovari" }],
  creator: "Kovari",
  publisher: "Kovari",
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
    title: "Kovari | Connect & Travel With the Right People",
    description: "The modern social travel platform. Skip the guesswork—match with like-minded travelers, plan trips together, and explore destinations safely.",
    siteName: "Kovari",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kovari | Connect & Travel With the Right People",
    description: "The modern social travel platform. Skip the guesswork—match with like-minded travelers, plan trips together, and explore destinations safely.",
    creator: "@KovariApp",
  },
  alternates: {
    canonical: "https://www.kovari.in",
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.webp",
    shortcut: "/favicon.webp",
    apple: "/favicon.webp",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          <script
            dangerouslySetInnerHTML={{
              __html: `
                try {
                  var marketingRoutes = ['/', '/about', '/privacy', '/terms', '/community-guidelines', '/user-safety', '/data-deletion'];
                  var isMarketing = marketingRoutes.includes(window.location.pathname);
                  var d = document.documentElement;
                  
                  if (isMarketing) {
                    d.classList.remove('dark');
                    d.style.colorScheme = 'light';
                  } else {
                    var theme = localStorage.getItem('kovari-theme');
                    if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                      d.classList.add('dark');
                      d.style.colorScheme = 'dark';
                    } else {
                      d.classList.remove('dark');
                      d.style.colorScheme = 'light';
                    }
                  }
                } catch (e) {}
              `,
            }}
          />
          <link
            href="https://api.fontshare.com/v2/css?f[]=clash-display@200,300,400,500,600,700&display=swap"
            rel="stylesheet"
          />
          <link
            href="https://fonts.googleapis.com/css2?family=Manrope:wght@200;300;400;500;600;700;800&display=swap"
            rel="stylesheet"
          />
        </head>
        <body
          className={`${inter.variable} ${poppins.variable} font-sans`}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
            storageKey="kovari-theme"
          >
            <HeroUIProvider>
              <AuthProvider>{children}</AuthProvider>
              <Toaster
                position="bottom-right"
                duration={3000}
              />
              <Analytics />
            </HeroUIProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}

