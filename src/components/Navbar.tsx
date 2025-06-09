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

export default function Navbar() {
  const { signOut } = useClerk();

  return (
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
          <Link href="/sign-in">
            <button
              className="px-4 py-2 bg-black text-white rounded"
              onClick={() => toast.info("Redirecting to sign-in")}
            >
              Sign In
            </button>
          </Link>
        </SignedOut>
      </div>
    </div>
  );
}
