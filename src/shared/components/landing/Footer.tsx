"use client";

import React from "react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 sm:gap-6">
          {/* Left: Brand */}
          <div className="flex flex-col items-center md:items-start">
            <h3 className="text-base sm:text-lg font-clash tracking-widest font-medium mb-2 md:mb-1">
              KOVARI
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Travel together, better.
            </p>
          </div>

          {/* Right: Links */}
          <nav className="flex flex-wrap justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-muted-foreground">
            <Link
              href="/about"
              className="hover:text-foreground transition-colors"
            >
              About
            </Link>
            <Link
              href="/privacy"
              className="hover:text-foreground transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="hover:text-foreground transition-colors"
            >
              Terms
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
