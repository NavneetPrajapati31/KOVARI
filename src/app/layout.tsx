import { type Metadata } from "next";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import "./globals.css";
import { Poppins, Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { HeroUIProvider } from "@heroui/react";

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
            {children}
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
