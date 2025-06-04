"use client";
import { UserButton, SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";
import Link from "next/link";

export default function Navbar() {
  return (
    <div className="flex justify-between items-center p-4 border-b bg-primary">
      <h1 className="text-xl font-heading font-bold text-white">KOVARI</h1>
      <div>
        <SignedIn>
          <UserButton />
        </SignedIn>
        <SignedOut>
          <Link href={"/sign-in"}>
            <button className="px-4 py-2 bg-black text-white rounded">
              Sign In
            </button>
          </Link>
        </SignedOut>
      </div>
    </div>
  );
}
