"use client";

import {
  UserButton,
  SignInButton,
  SignedIn,
  SignedOut,
  useClerk,
} from "@clerk/nextjs";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const { signOut } = useClerk();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleSignInClick = () => {
    setIsRedirecting(true);
    // toast.info("Redirecting to sign-in");
  };

  return (
    <>
      <div className="flex justify-between items-center p-4 border-b bg-primary">
        <h1 className="text-xl font-heading font-bold text-white">KOVARI</h1>
        <div className="flex items-center gap-4">
          <SignedIn>
            <UserButton />
            <button
              onClick={() => {
                signOut();
                toast.success("Signed out successfully");
              }}
              className="px-4 py-2 bg-black text-white rounded border-gray-500"
            >
              Sign Out
            </button>
          </SignedIn>

          <SignedOut>
            <Link href="/sign-in" onClick={handleSignInClick}>
              <button className="px-4 py-2 bg-black text-white rounded">
                Sign In
              </button>
            </Link>
          </SignedOut>
        </div>
      </div>

      {isRedirecting && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-transparent rounded-lg p-6 flex flex-col items-center space-y-4">
            <Loader2 className="h-11 w-11 animate-spin text-white" />
          </div>
        </div>
      )}
    </>
  );
}
