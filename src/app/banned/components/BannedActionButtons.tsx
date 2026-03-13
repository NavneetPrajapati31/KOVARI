"use client";

import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { useClerk } from "@clerk/nextjs";
import { Mail } from "lucide-react";
import Link from "next/link";
import { Spinner } from "@heroui/react";

export function BannedActionButtons() {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isContacting, setIsContacting] = useState(false);
  const { signOut } = useClerk();

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut({ redirectUrl: "/sign-in" });
  };

  return (
    <div className="mt-8 flex flex-col gap-3">
      <Link 
        href="mailto:support@kovari.in" 
        className="w-full"
        onClick={() => {
          setIsContacting(true);
          setTimeout(() => setIsContacting(false), 2000);
        }}
      >
        <Button 
          variant="outline" 
          disabled={isContacting}
          className="w-full h-12 rounded-xl border-border/60 bg-transparent hover:bg-secondary text-foreground flex items-center justify-center gap-2"
        >
          {isContacting ? (
            <Spinner variant="spinner" size="sm" classNames={{spinnerBars:"bg-foreground"}} />
          ) : (
            <Mail className="h-4 w-4 text-muted-foreground mr-1" />
          )}
          Contact Support
        </Button>
      </Link>
      
      <Button 
        onClick={handleSignOut}
        disabled={isSigningOut}
        className="w-full h-12 rounded-xl bg-primary text-primary-foreground hover:bg-foreground/90 font-medium transition-transform active:scale-[0.98]"
      >
        {isSigningOut ? (
          <Spinner variant="spinner" size="sm" classNames={{spinnerBars:"bg-background"}} className="mr-2" />
        ) : null}
        Sign Out
      </Button>
    </div>
  );
}
