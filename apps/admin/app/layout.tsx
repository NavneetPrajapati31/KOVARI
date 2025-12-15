import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import { AdminLayoutWrapper } from '@/components/AdminLayoutWrapper';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'KOVARI Admin',
  description: 'Internal admin dashboard for KOVARI',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // During build, ClerkProvider may fail validation with dummy keys
  // Skip ClerkProvider during build phase to allow static generation to complete
  const isBuild = process.env.NEXT_PHASE === 'phase-production-build';
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  // Only use ClerkProvider if not in build phase or if we have a real key
  // Real Clerk keys are longer and don't contain our dummy pattern
  const isDummyKey = publishableKey?.includes(
    '51AbCdEfGhIjKlMnOpQrStUvWxYz1234567890',
  );
  const shouldUseClerk = !isBuild || !isDummyKey;

  const content = (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AdminLayoutWrapper>{children}</AdminLayoutWrapper>
      </body>
    </html>
  );

  if (shouldUseClerk && publishableKey) {
    return <ClerkProvider>{content}</ClerkProvider>;
  }

  // During build with dummy keys, render without ClerkProvider
  // UserButton in AdminTopbar will render a placeholder instead
  return content;
}
