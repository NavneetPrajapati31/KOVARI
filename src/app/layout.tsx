import { type Metadata } from "next";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";

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
  title: "KOVARI",
  description: "Connect with like-minded travelers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
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
          </HeroUIProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
